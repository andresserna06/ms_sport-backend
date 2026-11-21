import { ValidationError } from 'class-validator';
import { buildValidationException } from './validation.exception';

describe('buildValidationException', () => {
  it('builds a flat { field: message } object using the first constraint', () => {
    const errors = [
      {
        property: 'name',
        constraints: { isNotEmpty: 'El nombre es obligatorio', isString: 'x' },
      },
      {
        property: 'parentSportId',
        constraints: { isInt: 'El deporte padre debe ser un número entero' },
      },
    ] as ValidationError[];

    expect(buildValidationException(errors).fields).toEqual({
      name: 'El nombre es obligatorio',
      parentSportId: 'El deporte padre debe ser un número entero',
    });
  });

  it('reports the most basic rule first, whatever the decorator order', () => {
    const errors = [
      {
        property: 'name',
        constraints: { maxLength: 'Demasiado largo', isString: 'Debe ser texto' },
      },
    ] as ValidationError[];

    expect(buildValidationException(errors).fields).toEqual({
      name: 'Debe ser texto',
    });
  });

  it('translates the whitelist violation', () => {
    const errors = [
      {
        property: 'active',
        constraints: { whitelistValidation: 'property active should not exist' },
      },
    ] as ValidationError[];

    expect(buildValidationException(errors).fields).toEqual({
      active: 'El campo no está permitido',
    });
  });

  it('uses dotted paths for nested errors', () => {
    const errors = [
      {
        property: 'address',
        children: [{ property: 'city', constraints: { isString: 'Ciudad inválida' } }],
      },
    ] as ValidationError[];

    expect(buildValidationException(errors).fields).toEqual({
      'address.city': 'Ciudad inválida',
    });
  });
});
