import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { toBoolean } from '../../common/transformers/query-transformers';

export class ListSportsQueryDto {
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'El filtro active debe ser true o false' })
  active?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'El filtro all debe ser true o false' })
  all?: boolean;

  @IsOptional()
  @IsString({ message: 'El filtro name debe ser un texto' })
  @MaxLength(120, { message: 'El filtro name no puede superar los 120 caracteres' })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El filtro parentSportId debe ser un número entero' })
  @Min(1, { message: 'El filtro parentSportId debe ser un id válido' })
  parentSportId?: number;
}
