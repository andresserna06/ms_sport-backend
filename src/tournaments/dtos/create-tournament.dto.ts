import { Transform } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export class CreateTournamentDto {
  @Transform(trimString)
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres' })
  name!: string;

  @IsInt({ message: 'El deporte debe ser un número entero' })
  @IsPositive({ message: 'El deporte debe ser un id positivo' })
  sportId!: number;

  // Matches checks the YYYY-MM-DD shape; IsISO8601 (strict) rejects impossible
  // dates such as 2026-13-45 or 2026-02-30.
  @Matches(DATE_FORMAT, {
    message: 'La fecha de inicio debe tener el formato AAAA-MM-DD',
  })
  @IsISO8601({ strict: true }, { message: 'La fecha de inicio no es válida' })
  startDate!: string;

  @Matches(DATE_FORMAT, {
    message: 'La fecha límite de inscripción debe tener el formato AAAA-MM-DD',
  })
  @IsISO8601(
    { strict: true },
    { message: 'La fecha límite de inscripción no es válida' },
  )
  enrollmentDeadline!: string;
}
