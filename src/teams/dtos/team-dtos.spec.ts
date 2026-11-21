import { ValidationPipe } from '@nestjs/common';
import { buildValidationException } from '../../exception/validation.exception';
import { CreateTeamDto } from './create-team.dto';
import { ListTeamsQueryDto } from './list-teams-query.dto';
import { UpdateTeamDto } from './update-team.dto';

// Same options as main.ts, so the DTOs are tested the way the API uses them.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: buildValidationException,
});

const body = (value: unknown, metatype: new () => object = CreateTeamDto) =>
  pipe.transform(value, { type: 'body', metatype });

const expectFields = (promise: Promise<unknown>, fields: object) =>
  expect(promise).rejects.toMatchObject({ fields });

const validTeam = {
  name: 'Atlético',
  city: 'Medellín',
  contactEmail: 'info@atletico.com',
};

describe('CreateTeamDto / UpdateTeamDto', () => {
  it('accepts a valid body and trims the strings', async () => {
    const dto = (await body({
      name: '  Atlético ',
      city: ' Medellín ',
      contactEmail: ' info@atletico.com ',
      foundedYear: 1947,
    })) as CreateTeamDto;

    expect(dto).toMatchObject({
      name: 'Atlético',
      city: 'Medellín',
      contactEmail: 'info@atletico.com',
    });
  });

  it.each(['name', 'city'])('rejects a %s with only spaces', async (field) => {
    const message =
      field === 'name' ? 'El nombre es obligatorio' : 'La ciudad es obligatoria';

    await expectFields(body({ ...validTeam, [field]: '   ' }), {
      [field]: message,
    });
  });

  it('says the email is required (not just invalid) when it is missing', async () => {
    await expectFields(body({ name: 'A', city: 'B' }), {
      contactEmail: 'El correo de contacto es obligatorio',
    });
  });

  it('rejects an invalid email', async () => {
    await expectFields(body({ ...validTeam, contactEmail: 'no-es-correo' }), {
      contactEmail: 'El correo de contacto no es válido',
    });
  });

  it('rejects a founded year before 1800', async () => {
    await expectFields(body({ ...validTeam, foundedYear: 1700 }), {
      foundedYear: 'El año de fundación no puede ser anterior a 1800',
    });
  });

  it('rejects a future founded year, evaluated at validation time', async () => {
    await expectFields(
      body({ ...validTeam, foundedYear: new Date().getFullYear() + 1 }),
      { foundedYear: 'El año de fundación no puede ser futuro' },
    );
    await expect(
      body({ ...validTeam, foundedYear: new Date().getFullYear() }),
    ).resolves.toBeDefined();
  });

  it('UpdateTeamDto accepts a partial body but still trims and validates', async () => {
    await expect(body({ city: ' Cali ' }, UpdateTeamDto)).resolves.toMatchObject({
      city: 'Cali',
    });
    await expectFields(body({ name: '   ' }, UpdateTeamDto), {
      name: 'El nombre es obligatorio',
    });
  });
});

describe('ListTeamsQueryDto', () => {
  const query = (value: unknown) =>
    pipe.transform(value, { type: 'query', metatype: ListTeamsQueryDto });

  it('converts the active filter', async () => {
    await expect(query({ active: 'true' })).resolves.toMatchObject({
      active: true,
    });
  });

  it('rejects an invalid active filter in Spanish', async () => {
    await expectFields(query({ active: 'x' }), {
      active: 'El filtro active debe ser true o false',
    });
  });
});
