import { IsInt, IsOptional, Min } from 'class-validator';

export class FinishMatchDto {
  @IsOptional()
  @IsInt({ message: 'El marcador local debe ser un número entero' })
  @Min(0, { message: 'El marcador local debe ser mayor o igual a 0' })
  homeScore?: number;

  @IsOptional()
  @IsInt({ message: 'El marcador visitante debe ser un número entero' })
  @Min(0, { message: 'El marcador visitante debe ser mayor o igual a 0' })
  awayScore?: number;
}
