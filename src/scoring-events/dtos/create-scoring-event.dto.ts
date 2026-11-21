import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateScoringEventDto {
  @IsInt({ message: 'El playerId debe ser un número entero' })
  @Min(1, { message: 'El playerId debe ser mayor o igual a 1' })
  playerId!: number;

  @IsInt({ message: 'El teamId debe ser un número entero' })
  @Min(1, { message: 'El teamId debe ser mayor o igual a 1' })
  teamId!: number;

  @IsInt({ message: 'El minuto debe ser un número entero' })
  @Min(0, { message: 'El minuto debe ser mayor o igual a 0' })
  minute!: number;

  @Transform(trimString)
  @IsString({ message: 'El tipo de anotación debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo de anotación es obligatorio' })
  @MaxLength(50, {
    message: 'El tipo de anotación no puede superar los 50 caracteres',
  })
  type!: string;
}
