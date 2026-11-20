import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApplicationException } from './application.exception';
import { ErrorCase } from './error-case.enum';

const STATUS_BY_CASE: Record<ErrorCase, HttpStatus> = {
  [ErrorCase.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCase.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCase.INVALID_OPERATION]: HttpStatus.BAD_REQUEST,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ApplicationException) {
      response.status(STATUS_BY_CASE[exception.errorCase]).json({
        errorCase: exception.errorCase,
        message: exception.message,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] }).message ?? exception.message);
      const errorCase =
        status === HttpStatus.BAD_REQUEST && Array.isArray(message)
          ? 'VALIDATION_ERROR'
          : 'HTTP_ERROR';

      response.status(status).json({ errorCase, message });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      errorCase: 'INTERNAL_ERROR',
      message: 'Ocurrió un error interno en el servidor',
    });
  }
}
