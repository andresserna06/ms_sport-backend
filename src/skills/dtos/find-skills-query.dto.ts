import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class FindSkillsQueryDto {
  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'El filtro name debe ser una cadena de texto' })
  @MaxLength(100, {
    message: 'El filtro name no puede superar los 100 caracteres',
  })
  name?: string;
}
