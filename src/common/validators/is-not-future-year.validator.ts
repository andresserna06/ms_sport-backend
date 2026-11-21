import { registerDecorator, ValidationOptions } from 'class-validator';

// The current year is read when each request is validated, not once when the
// module is loaded, so a long-running process never goes stale at new year.
export function IsNotFutureYear(options?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'isNotFutureYear',
      target: target.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'number' && value <= new Date().getFullYear(),
      },
    });
  };
}
