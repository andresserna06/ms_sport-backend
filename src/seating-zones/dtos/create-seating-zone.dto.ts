import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';

export class CreateSeatingZoneDto {
  @IsInt({ message: 'El campo escenario debe ser un número entero' })
  @IsPositive({ message: 'El campo escenario debe ser un id positivo' })
  venueId!: number;

  @Transform(trimString)
  @IsString({ message: 'El campo nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El campo nombre es obligatorio' })
  @MaxLength(100, {
    message: 'El campo nombre no puede superar los 100 caracteres',
  })
  name!: string;

  @IsOptional()
  @IsInt({ message: 'El campo capacidad debe ser un número entero' })
  @Min(0, { message: 'El campo capacidad no puede ser menor que 0' })
  capacity?: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El campo precio debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El campo precio no puede ser negativo' })
  price!: number;
}
