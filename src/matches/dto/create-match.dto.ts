import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateMatchDto {
  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  homeTeamId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  awayTeamId?: number;
}
