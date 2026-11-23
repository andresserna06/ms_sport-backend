import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';

export class CreateVenueDto {
  @Transform(trimString)
  @IsString({ message: 'El campo nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio' })
  @MaxLength(120, {
    message: 'El campo nombre no puede superar los 120 caracteres',
  })
  name!: string;

  @Transform(trimString)
  @IsString({ message: 'El campo ciudad debe ser un texto' })
  @IsNotEmpty({ message: 'El campo ciudad es obligatorio' })
  @MaxLength(100, {
    message: 'El campo ciudad no puede superar los 100 caracteres',
  })
  city!: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El campo dirección debe ser un texto' })
  @MaxLength(200, {
    message: 'El campo dirección no puede superar los 200 caracteres',
  })
  address?: string;

  @IsOptional()
  @IsInt({ message: 'El campo capacidad debe ser un número entero' })
  @Min(0, { message: 'El campo capacidad no puede ser menor que 0' })
  capacity?: number;

  @IsOptional()
  @IsBoolean({ message: 'El campo estado activo debe ser true o false' })
  active?: boolean;

  @IsOptional()
  @IsInt({ message: 'El campo escenario padre debe ser un número entero' })
  @IsPositive({ message: 'El campo escenario padre debe ser un id positivo' })
  parentVenueId?: number;
}
