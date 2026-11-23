import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';

export class CreatePaymentMethodDto {
  @Transform(trimString)
  @IsString({ message: 'El campo nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio' })
  @MaxLength(60, {
    message: 'El campo nombre no puede superar los 60 caracteres',
  })
  name!: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo estado activo debe ser true o false' })
  active?: boolean;
}
