import { ValidationPipe } from '@nestjs/common';
import { buildValidationException } from '../../exception/validation.exception';
import { CreateTournamentDto } from './create-tournament.dto';
import { ListTournamentsQueryDto } from './list-tournaments-query.dto';
import { UpdateTournamentDto } from './update-tournament.dto';

// Same options as main.ts, so the DTOs are tested the way the API uses them.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: buildValidationException,
});

const body = (
  value: unknown,
  metatype: new () => object = CreateTournamentDto,
) => pipe.transform(value, { type: 'body', metatype });

const query = (value: unknown) =>
  pipe.transform(value, { type: 'query', metatype: ListTournamentsQueryDto });

const expectFields = (promise: Promise<unknown>, fields: object) =>
  expect(promise).rejects.toMatchObject({ fields });

const valid = {
  name: 'Copa',
  sportId: 1,
  startDate: '2026-03-01',
  enrollmentDeadline: '2026-02-01',
};

describe('CreateTournamentDto', () => {
  it('accepts a valid body and trims the name', async () => {
    await expect(body({ ...valid, name: '  Copa  ' })).resolves.toMatchObject({
      name: 'Copa',
      sportId: 1,
    });
  });

  it('rejects a wrong date format in Spanish', async () => {
    await expectFields(body({ ...valid, startDate: '01/03/2026' }), {
      startDate: 'La fecha de inicio debe tener el formato AAAA-MM-DD',
    });
  });

  it.each(['2026-13-45', '2026-02-30'])(
    'rejects the impossible date %s',
    async (startDate) => {
      await expectFields(body({ ...valid, startDate }), {
        startDate: 'La fecha de inicio no es válida',
      });
    },
  );

  it('rejects an impossible enrollment deadline', async () => {
    await expectFields(body({ ...valid, enrollmentDeadline: '2026-00-10' }), {
      enrollmentDeadline: 'La fecha límite de inscripción no es válida',
    });
  });

  it.each(['', '   '])('requires the name (%j)', async (name) => {
    await expectFields(body({ ...valid, name }), {
      name: 'El nombre es obligatorio',
    });
  });

  it('rejects a name longer than 120 characters', async () => {
    await expectFields(body({ ...valid, name: 'x'.repeat(121) }), {
      name: 'El nombre no puede superar los 120 caracteres',
    });
  });

  it('requires the sport', async () => {
    const { sportId: _omitted, ...withoutSport } = valid;

    await expectFields(body(withoutSport), {
      sportId: 'El deporte debe ser un número entero',
    });
  });

  it.each([0, -3])('rejects the non positive sport id %s', async (sportId) => {
    await expectFields(body({ ...valid, sportId }), {
      sportId: 'El deporte debe ser un id positivo',
    });
  });

  it.each(['1', 1.5, null])('rejects the sport id %j', async (sportId) => {
    await expectFields(body({ ...valid, sportId }), {
      sportId: 'El deporte debe ser un número entero',
    });
  });

  it('rejects fields that are not allowed', async () => {
    await expectFields(body({ ...valid, active: false }), {
      active: 'El campo no está permitido',
    });
  });
});

describe('UpdateTournamentDto', () => {
  it('is a full replacement: it requires every field', async () => {
    await expectFields(body({ name: 'Copa' }, UpdateTournamentDto), {
      sportId: 'El deporte debe ser un número entero',
      startDate: 'La fecha de inicio debe tener el formato AAAA-MM-DD',
      enrollmentDeadline:
        'La fecha límite de inscripción debe tener el formato AAAA-MM-DD',
    });
  });

  it('accepts a complete body', async () => {
    await expect(body(valid, UpdateTournamentDto)).resolves.toBeDefined();
  });
});

describe('ListTournamentsQueryDto', () => {
  it('converts the filters', async () => {
    await expect(
      query({ active: 'false', sportId: '3', name: ' copa ' }),
    ).resolves.toMatchObject({ active: false, sportId: 3, name: 'copa' });
  });

  it('accepts an empty query', async () => {
    await expect(query({})).resolves.toBeDefined();
  });

  it('rejects an invalid active filter in Spanish', async () => {
    await expectFields(query({ active: 'abc' }), {
      active: 'El filtro active debe ser true o false',
    });
  });

  it.each(['abc', '0', '1.5'])(
    'rejects the sportId filter %s',
    async (sportId) => {
      await expect(query({ sportId })).rejects.toMatchObject({
        fields: { sportId: expect.stringContaining('sportId') },
      });
    },
  );

  it('rejects an empty name filter', async () => {
    await expectFields(query({ name: '   ' }), {
      name: 'El filtro name no puede estar vacío',
    });
  });
});
