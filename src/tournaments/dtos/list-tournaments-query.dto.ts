import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import {
  toBoolean,
  trimString,
} from '../../common/transformers/query-transformers';

export class ListTournamentsQueryDto {
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'El filtro active debe ser true o false' })
  active?: boolean;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
  )
  @IsInt({ message: 'El filtro sportId debe ser un número entero' })
  @IsPositive({ message: 'El filtro sportId debe ser un id positivo' })
  sportId?: number;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El filtro name debe ser un texto' })
  @IsNotEmpty({ message: 'El filtro name no puede estar vacío' })
  name?: string;
}
