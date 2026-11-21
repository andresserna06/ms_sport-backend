import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AssignPlayerSkillDto {
  @IsOptional()
  @IsInt({ message: 'El nivel debe ser un número entero' })
  @Min(1, { message: 'El nivel mínimo es 1' })
  @Max(5, { message: 'El nivel máximo es 5' })
  level?: number;
}
