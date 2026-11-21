import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateMatchDto {
  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @Min(1)
  phaseId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  homeTeamId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  awayTeamId?: number;
}
