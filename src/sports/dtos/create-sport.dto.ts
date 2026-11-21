import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';

export class CreateSportDto {
  @Transform(trimString)
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres' })
  name!: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  description?: string | null;

  @IsOptional()
  @IsInt({ message: 'El deporte padre debe ser un número entero' })
  @Min(1, { message: 'El deporte padre debe ser un id válido' })
  parentSportId?: number | null;
}
