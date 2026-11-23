import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateBetDto {
  @IsInt({ message: 'El campo aficionado debe ser un número entero' })
  @IsPositive({ message: 'El campo aficionado debe ser un id positivo' })
  fanId!: number;

  @IsInt({ message: 'El campo partido debe ser un número entero' })
  @IsPositive({ message: 'El campo partido debe ser un id positivo' })
  matchId!: number;

  @IsInt({
    message: 'El campo método de pago del aficionado debe ser un número entero',
  })
  @IsPositive({
    message: 'El campo método de pago del aficionado debe ser un id positivo',
  })
  fanPaymentMethodId!: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El campo monto debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El campo monto no puede ser negativo' })
  amount!: number;
}
