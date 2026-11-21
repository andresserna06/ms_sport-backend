import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePlayerDto {
  @IsInt({ message: 'El userId debe ser un número entero' })
  @Min(1, { message: 'El userId debe ser mayor o igual a 1' })
  userId!: number;

  @Transform(trimString)
  @IsString({ message: 'El documento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El documento es obligatorio' })
  @MaxLength(30, { message: 'El documento no puede superar los 30 caracteres' })
  document!: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'La posición debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La posición no puede estar vacía' })
  @MaxLength(60, { message: 'La posición no puede superar los 60 caracteres' })
  position?: string;

  @IsOptional()
  @IsInt({ message: 'El número de camiseta debe ser un entero' })
  @Min(0, { message: 'El número de camiseta debe ser mayor o igual a 0' })
  @Max(99, { message: 'El número de camiseta no puede superar 99' })
  jerseyNumber?: number;
}
