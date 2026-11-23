import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';

const DUPLICATE_ENTRY = 'ER_DUP_ENTRY';
const REFERENCED_ROW = ['ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'];
const MISSING_REFERENCED_ROW = [
  'ER_NO_REFERENCED_ROW',
  'ER_NO_REFERENCED_ROW_2',
];

// Domain errors raised by the repositories, so the services never interpret
// database driver errors.
export class DuplicateRecordError extends Error {
  constructor() {
    super('A record with the same unique values already exists');
    this.name = 'DuplicateRecordError';
  }
}

export class MissingReferenceError extends Error {
  constructor(readonly constraint?: string) {
    super('A referenced record does not exist');
    this.name = 'MissingReferenceError';
  }
}

export class RecordInUseError extends Error {
  constructor() {
    super('The record is referenced by other records');
    this.name = 'RecordInUseError';
  }
}

interface DriverErrorShape {
  code?: string;
  message?: string;
  sqlMessage?: string;
  driverError?: { code?: string; message?: string; sqlMessage?: string };
}

// Returns the domain error that matches a MySQL error, or the original error
// when it is not one the repositories know how to translate.
export function translateDatabaseError(error: unknown): unknown {
  const candidate = error as DriverErrorShape;
  const code = candidate?.driverError?.code ?? candidate?.code;
  if (code === DUPLICATE_ENTRY) return new DuplicateRecordError();
  if (code && REFERENCED_ROW.includes(code)) return new RecordInUseError();
  if (code && MISSING_REFERENCED_ROW.includes(code)) {
    const text =
      candidate?.driverError?.sqlMessage ??
      candidate?.driverError?.message ??
      candidate?.sqlMessage ??
      candidate?.message ??
      '';
    return new MissingReferenceError(/CONSTRAINT `([^`]+)`/.exec(text)?.[1]);
  }
  return error;
}

export interface PersistenceMessages {
  // "el escenario", "la localidad"...: used inside the messages.
  singular: string;
  // Message for a UNIQUE violation.
  duplicate: string;
  // Foreign key constraint name -> "el aficionado", "el partido"...
  references: Record<string, string>;
}

// Turns a repository error into the project error format. Anything unknown is
// returned unchanged so it keeps being a 500.
export function toApplicationException(
  error: unknown,
  messages: PersistenceMessages,
): unknown {
  if (error instanceof DuplicateRecordError) {
    return new ApplicationException(
      ErrorCase.ALREADY_EXISTS,
      messages.duplicate,
    );
  }
  if (error instanceof MissingReferenceError) {
    const what =
      (error.constraint && messages.references[error.constraint]) ||
      'uno de los registros referenciados';
    return new ApplicationException(ErrorCase.NOT_FOUND, `No existe ${what}`);
  }
  if (error instanceof RecordInUseError) {
    return new ApplicationException(
      ErrorCase.INVALID_STATE,
      `No se puede eliminar ${messages.singular}: tiene información asociada`,
    );
  }
  return error;
}
