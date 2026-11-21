import { ValidationPipe } from '@nestjs/common';
import { buildValidationException } from '../../exception/validation.exception';
import { CreateTournamentDto } from './create-tournament.dto';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: buildValidationException,
});

const body = (value: unknown) =>
  pipe.transform(value, { type: 'body', metatype: CreateTournamentDto });

const valid = {
  name: 'Copa',
  startDate: '2026-03-01',
  enrollmentDeadline: '2026-02-01',
};

describe('CreateTournamentDto', () => {
  it('accepts a valid body', async () => {
    await expect(body(valid)).resolves.toBeDefined();
  });

  it('rejects a wrong date format in Spanish', async () => {
    await expect(body({ ...valid, startDate: '01/03/2026' })).rejects.toMatchObject({
      fields: { startDate: 'La fecha de inicio debe tener el formato AAAA-MM-DD' },
    });
  });

  it.each(['2026-13-45', '2026-02-30'])(
    'rejects the impossible date %s',
    async (startDate) => {
      await expect(body({ ...valid, startDate })).rejects.toMatchObject({
        fields: { startDate: 'La fecha de inicio no es válida' },
      });
    },
  );

  it('rejects an impossible enrollment deadline', async () => {
    await expect(
      body({ ...valid, enrollmentDeadline: '2026-00-10' }),
    ).rejects.toMatchObject({
      fields: { enrollmentDeadline: 'La fecha límite de inscripción no es válida' },
    });
  });

  it('requires the name', async () => {
    await expect(body({ ...valid, name: '' })).rejects.toMatchObject({
      fields: { name: 'El nombre es obligatorio' },
    });
  });
});
