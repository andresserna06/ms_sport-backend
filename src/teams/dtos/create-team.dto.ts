import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';
import { IsNotFutureYear } from '../../common/validators/is-not-future-year.validator';

// Image data URL: data:image/<png|jpeg|webp|gif>;base64,<data>
const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;
// ~500 KB of image once decoded.
const MAX_LOGO_LENGTH = 700_000;

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

  @IsOptional()
  @IsString({ message: 'El logo debe ser una imagen' })
  @MaxLength(MAX_LOGO_LENGTH, { message: 'El logo no puede superar los 500 KB' })
  @Matches(IMAGE_DATA_URL, {
    message: 'El logo debe ser una imagen PNG, JPG, WEBP o GIF',
  })
  logo?: string;
}
