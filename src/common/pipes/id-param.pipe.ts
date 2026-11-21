import { ArgumentMetadata, ParseIntPipe } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';

const INTEGER = /^-?\d+$/;

// Nest's ParseIntPipe also accepts exponent notation ("1e2" becomes 100), which
// would silently turn a malformed id into a different valid one. Only plain
// digits are accepted here.
class StrictIntPipe extends ParseIntPipe {
  constructor() {
    super({
      exceptionFactory: () =>
        new ApplicationException(
          ErrorCase.INVALID_OPERATION,
          'El id debe ser un número entero',
        ),
    });
  }

  override async transform(value: string, metadata: ArgumentMetadata) {
    if (!INTEGER.test(String(value))) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'El id debe ser un número entero',
      );
    }
    return super.transform(value, metadata);
  }
}

// Route ids must be integers; anything else answers 400 with a Spanish message
// in the project error format.
export const idParamPipe = () => new StrictIntPipe();
