import { ErrorCase } from './error-case.enum';

export class ApplicationException extends Error {
  constructor(
    public readonly errorCase: ErrorCase,
    message: string,
  ) {
    super(message);
    this.name = 'ApplicationException';
  }
}
