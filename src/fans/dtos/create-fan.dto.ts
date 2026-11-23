import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CreateFanDto {
  @Type(() => Number)
  @IsInt({ message: 'El campo userId debe ser un número entero' })
  @Min(1, { message: 'El campo userId debe ser mayor o igual a 1' })
  userId!: number;

  @IsOptional()
  @IsBoolean({ message: 'El campo estado activo debe ser true o false' })
  active?: boolean;
}
