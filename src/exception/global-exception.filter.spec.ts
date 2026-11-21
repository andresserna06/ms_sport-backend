import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { ApplicationException } from './application.exception';
import { ErrorCase } from './error-case.enum';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ValidationException } from './validation.exception';

const buildHost = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
};

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  it.each([
    [ErrorCase.NOT_FOUND, 404],
    [ErrorCase.ALREADY_EXISTS, 409],
    [ErrorCase.INVALID_STATE, 409],
    [ErrorCase.INVALID_OPERATION, 400],
  ])('maps %s to HTTP %i using { errorCase, message }', (errorCase, code) => {
    const { host, status, json } = buildHost();

    filter.catch(new ApplicationException(errorCase, 'Mensaje'), host);

    expect(status).toHaveBeenCalledWith(code);
    expect(json).toHaveBeenCalledWith({ errorCase, message: 'Mensaje' });
  });

  it('answers 400 with a flat { field: message } object on validation errors', () => {
    const { host, status, json } = buildHost();

    filter.catch(new ValidationException({ name: 'El nombre es obligatorio' }), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ name: 'El nombre es obligatorio' });
  });

  it('wraps other Nest HTTP exceptions as HTTP_ERROR', () => {
    const { host, status, json } = buildHost();

    filter.catch(new NotFoundException('Ruta no encontrada'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      errorCase: 'HTTP_ERROR',
      message: 'Ruta no encontrada',
    });
  });

  it('keeps the message list of a Nest HTTP exception', () => {
    const { host, json } = buildHost();

    filter.catch(new BadRequestException(['a', 'b']), host);

    expect(json).toHaveBeenCalledWith({
      errorCase: 'HTTP_ERROR',
      message: ['a', 'b'],
    });
  });

  it('answers 500 without leaking details on unexpected errors', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { host, status, json } = buildHost();

    filter.catch(new Error('secret detail'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      errorCase: 'INTERNAL_ERROR',
      message: 'Ocurrió un error interno en el servidor',
    });
    expect(loggerSpy).toHaveBeenCalled();
    loggerSpy.mockRestore();
  });
});
