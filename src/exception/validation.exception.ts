import { ValidationError } from 'class-validator';

// DTO validation failure. The filter answers 400 with a flat object
// { field: message }, the format ms_security uses and the frontend reads.
export class ValidationException extends Error {
  constructor(public readonly fields: Record<string, string>) {
    super('Validation failed');
    this.name = 'ValidationException';
  }
}

// When a field breaks several rules, the most basic one is reported first
// (required, then type, then the rest), regardless of decorator order.
const CONSTRAINT_PRIORITY = [
  'isDefined',
  'isNotEmpty',
  'isString',
  'isInt',
  'isNumber',
  'isBoolean',
  'isEmail',
  'matches',
];

export function buildValidationException(
  errors: ValidationError[],
): ValidationException {
  return new ValidationException(flattenErrors(errors));
}

function pickConstraint(constraints: Record<string, string>): string {
  const keys = Object.keys(constraints);
  if (keys.includes('whitelistValidation')) return 'whitelistValidation';
  return CONSTRAINT_PRIORITY.find((key) => keys.includes(key)) ?? keys[0];
}

function flattenErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      const constraint = pickConstraint(error.constraints);
      fields[path] =
        constraint === 'whitelistValidation'
          ? 'El campo no está permitido'
          : error.constraints[constraint];
    }
    if (error.children?.length) {
      Object.assign(fields, flattenErrors(error.children, path));
    }
  }

  return fields;
}
