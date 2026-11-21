// Shared class-transformer helpers for DTOs.

// Trims strings before validation, so "   " is rejected as empty.
export const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Query-string booleans: "true" / "false" become real booleans; any other
// value is left untouched so @IsBoolean rejects it.
export const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};
