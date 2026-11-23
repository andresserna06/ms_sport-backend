import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';

export class CreateFanPaymentMethodDto {
  @IsInt({ message: 'El campo aficionado debe ser un número entero' })
  @IsPositive({ message: 'El campo aficionado debe ser un id positivo' })
  fanId!: number;

  @IsInt({ message: 'El campo método de pago debe ser un número entero' })
  @IsPositive({ message: 'El campo método de pago debe ser un id positivo' })
  paymentMethodId!: number;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El campo alias debe ser un texto' })
  @MaxLength(100, {
    message: 'El campo alias no puede superar los 100 caracteres',
  })
  alias?: string;
}
