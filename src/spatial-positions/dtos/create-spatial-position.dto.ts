import { IsISO8601, IsInt, IsNumber, IsPositive } from 'class-validator';

export class CreateSpatialPositionDto {
  @IsInt({ message: 'El campo pelota debe ser un número entero' })
  @IsPositive({ message: 'El campo pelota debe ser un id positivo' })
  ballId!: number;

  @IsInt({ message: 'El campo jugador debe ser un número entero' })
  @IsPositive({ message: 'El campo jugador debe ser un id positivo' })
  playerId!: number;

  @IsNumber(
    { maxDecimalPlaces: 3 },
    {
      message:
        'El campo coordenada x debe ser un número con máximo 3 decimales',
    },
  )
  x!: number;

  @IsNumber(
    { maxDecimalPlaces: 3 },
    {
      message:
        'El campo coordenada y debe ser un número con máximo 3 decimales',
    },
  )
  y!: number;

  @IsISO8601(
    { strict: true },
    {
      message:
        'El campo fecha de registro debe ser una fecha y hora válidas (ISO 8601)',
    },
  )
  recordedAt!: string;
}
