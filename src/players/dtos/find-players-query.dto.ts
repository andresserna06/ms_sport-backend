import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const parseQueryBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true) {
    return true;
  }
  if (value === 'false' || value === false) {
    return false;
  }
  return value;
};

export class FindPlayersQueryDto {
  @IsOptional()
  @Transform(parseQueryBoolean)
  @IsBoolean({ message: 'El filtro active debe ser true o false' })
  active?: boolean;

  @IsOptional()
  @Transform(parseQueryBoolean)
  @IsBoolean({ message: 'El filtro all debe ser true o false' })
  all?: boolean;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El filtro document debe ser una cadena de texto' })
  @MaxLength(30, {
    message: 'El filtro document no puede superar los 30 caracteres',
  })
  document?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El filtro position debe ser una cadena de texto' })
  @MaxLength(60, {
    message: 'El filtro position no puede superar los 60 caracteres',
  })
  position?: string;
}
