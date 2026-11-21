import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';
import { IsNotFutureYear } from '../../common/validators/is-not-future-year.validator';

export class CreateTeamDto {
  @Transform(trimString)
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres' })
  name!: string;

  @Transform(trimString)
  @IsString({ message: 'La ciudad debe ser un texto' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  @MaxLength(100, { message: 'La ciudad no puede superar los 100 caracteres' })
  city!: string;

  @Transform(trimString)
  @IsNotEmpty({ message: 'El correo de contacto es obligatorio' })
  @IsEmail({}, { message: 'El correo de contacto no es válido' })
  @MaxLength(150, {
    message: 'El correo de contacto no puede superar los 150 caracteres',
  })
  contactEmail!: string;

  @IsOptional()
  @IsInt({ message: 'El año de fundación debe ser un número entero' })
  @Min(1800, { message: 'El año de fundación no puede ser anterior a 1800' })
  @IsNotFutureYear({ message: 'El año de fundación no puede ser futuro' })
  foundedYear?: number;
}
