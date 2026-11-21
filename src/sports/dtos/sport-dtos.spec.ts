import { ValidationPipe } from '@nestjs/common';
import { buildValidationException } from '../../exception/validation.exception';
import { CreateSportDto } from './create-sport.dto';
import { ListSportsQueryDto } from './list-sports-query.dto';
import { ListSubSportsQueryDto } from './list-sub-sports-query.dto';
import { UpdateSportDto } from './update-sport.dto';

// Same options as main.ts, so the DTOs are tested the way the API uses them.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: buildValidationException,
});

const body = (value: unknown, metatype: new () => object = CreateSportDto) =>
  pipe.transform(value, { type: 'body', metatype });

const query = (value: unknown) =>
  pipe.transform(value, { type: 'query', metatype: ListSportsQueryDto });

const expectFields = (promise: Promise<unknown>, fields: object) =>
  expect(promise).rejects.toMatchObject({ fields });

describe('CreateSportDto / UpdateSportDto', () => {
  it('accepts a valid body and trims the strings', async () => {
    const dto = (await body({
      name: '  Fútbol  ',
      description: '  Deporte de balón ',
      parentSportId: 2,
    })) as CreateSportDto;

    expect(dto.name).toBe('Fútbol');
    expect(dto.description).toBe('Deporte de balón');
    expect(dto.parentSportId).toBe(2);
  });

  it('accepts a null parent (root sport)', async () => {
    await expect(body({ name: 'Tenis', parentSportId: null })).resolves.toBeDefined();
  });

  it('requires the name', async () => {
    await expectFields(body({}), { name: 'El nombre es obligatorio' });
  });

  it('rejects a name with only spaces', async () => {
    await expectFields(body({ name: '    ' }), {
      name: 'El nombre es obligatorio',
    });
  });

  it('rejects a name longer than 120 characters', async () => {
    await expectFields(body({ name: 'a'.repeat(121) }), {
      name: 'El nombre no puede superar los 120 caracteres',
    });
  });

  it('reports the type error first when the name is not a text', async () => {
    await expectFields(body({ name: 123 }), {
      name: 'El nombre debe ser un texto',
    });
  });

  it('rejects a description longer than 500 characters', async () => {
    await expectFields(body({ name: 'Tenis', description: 'a'.repeat(501) }), {
      description: 'La descripción no puede superar los 500 caracteres',
    });
  });

  it.each([
    ['abc', 'El deporte padre debe ser un número entero'],
    [1.5, 'El deporte padre debe ser un número entero'],
    [0, 'El deporte padre debe ser un id válido'],
  ])('rejects the parent id %p', async (parentSportId, message) => {
    await expectFields(body({ name: 'Sala', parentSportId }), {
      parentSportId: message,
    });
  });

  it.each(['active', 'id', 'subSports'])(
    'rejects the extra field "%s"',
    async (field) => {
      await expectFields(body({ name: 'Tenis', [field]: true }), {
        [field]: 'El campo no está permitido',
      });
    },
  );

  it('UpdateSportDto applies the same rules (name is required in PUT)', async () => {
    await expectFields(body({ description: 'x' }, UpdateSportDto), {
      name: 'El nombre es obligatorio',
    });
  });
});

describe('ListSportsQueryDto', () => {
  it('accepts an empty query', async () => {
    await expect(query({})).resolves.toBeDefined();
  });

  it('converts the booleans and the parent id', async () => {
    const dto = (await query({
      active: 'false',
      all: 'true',
      name: 'fut',
      parentSportId: '3',
    })) as ListSportsQueryDto;

    expect(dto.active).toBe(false);
    expect(dto.all).toBe(true);
    expect(dto.name).toBe('fut');
    expect(dto.parentSportId).toBe(3);
  });

  it('rejects a value that is not a boolean', async () => {
    await expectFields(query({ active: 'maybe' }), {
      active: 'El filtro active debe ser true o false',
    });
  });

  it('rejects a repeated name (?name=a&name=b)', async () => {
    await expectFields(query({ name: ['a', 'b'] }), {
      name: 'El filtro name debe ser un texto',
    });
  });

  it('rejects a parent id that is not an integer', async () => {
    await expectFields(query({ parentSportId: 'x' }), {
      parentSportId: 'El filtro parentSportId debe ser un número entero',
    });
  });

  it('rejects unknown query parameters', async () => {
    await expectFields(query({ foo: 'bar' }), {
      foo: 'El campo no está permitido',
    });
  });
});

describe('ListSubSportsQueryDto', () => {
  const subQuery = (value: unknown) =>
    pipe.transform(value, { type: 'query', metatype: ListSubSportsQueryDto });

  it('converts active and all', async () => {
    await expect(subQuery({ active: 'false', all: 'true' })).resolves.toMatchObject({
      active: false,
      all: true,
    });
  });

  it('rejects a value that is not a boolean', async () => {
    await expectFields(subQuery({ active: 'x' }), {
      active: 'El filtro active debe ser true o false',
    });
  });

  it('rejects filters that only apply to the main list', async () => {
    await expectFields(subQuery({ name: 'fut' }), {
      name: 'El campo no está permitido',
    });
  });
});
