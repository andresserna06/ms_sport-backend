import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from 'class-validator';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePlayerContractDto {
  @IsInt({ message: 'El playerId debe ser un número entero' })
  @Min(1, { message: 'El playerId debe ser mayor o igual a 1' })
  playerId!: number;

  @Transform(trimString)
  @Matches(ISO_DATE_PATTERN, {
    message: 'La fecha de inicio debe tener formato YYYY-MM-DD',
  })
  @IsDateString(
    { strict: true },
    { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' },
  )
  startDate!: string;

  @IsOptional()
  @Transform(trimString)
  @Matches(ISO_DATE_PATTERN, {
    message: 'La fecha de fin debe tener formato YYYY-MM-DD',
  })
  @IsDateString(
    { strict: true },
    { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)' },
  )
  endDate?: string | null;
}
