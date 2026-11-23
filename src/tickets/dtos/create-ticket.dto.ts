import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateTicketDto {
  @IsInt({ message: 'El campo aficionado debe ser un número entero' })
  @IsPositive({ message: 'El campo aficionado debe ser un id positivo' })
  fanId!: number;

  @IsInt({ message: 'El campo partido debe ser un número entero' })
  @IsPositive({ message: 'El campo partido debe ser un id positivo' })
  matchId!: number;

  @IsInt({ message: 'El campo localidad debe ser un número entero' })
  @IsPositive({ message: 'El campo localidad debe ser un id positivo' })
  seatingZoneId!: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El campo precio debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El campo precio no puede ser negativo' })
  price!: number;
}
