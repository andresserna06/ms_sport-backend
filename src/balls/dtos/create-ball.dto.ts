import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { trimString } from '../../common/transformers/query-transformers';

export class CreateBallDto {
  @IsInt({ message: 'El campo partido debe ser un número entero' })
  @IsPositive({ message: 'El campo partido debe ser un id positivo' })
  matchId!: number;

  @Transform(trimString)
  @IsString({ message: 'El campo número de serie debe ser un texto' })
  @IsNotEmpty({ message: 'El campo número de serie es obligatorio' })
  @MaxLength(60, {
    message: 'El campo número de serie no puede superar los 60 caracteres',
  })
  serialNumber!: string;
}
