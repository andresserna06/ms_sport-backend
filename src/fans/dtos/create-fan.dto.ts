import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';

export class CreateFanDto {
  @Transform(trimString)
  @IsString({ message: 'El campo nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio' })
  @MaxLength(120, {
    message: 'El campo nombre no puede superar los 120 caracteres',
  })
  name!: string;

  @Transform(trimString)
  @IsString({ message: 'El campo correo debe ser un texto' })
  @IsNotEmpty({ message: 'El campo correo es obligatorio' })
  @IsEmail({}, { message: 'El campo correo no es válido' })
  @MaxLength(150, {
    message: 'El campo correo no puede superar los 150 caracteres',
  })
  email!: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo estado activo debe ser true o false' })
  active?: boolean;
}
