import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateMatchDto {
  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @Min(1)
  phaseId!: number;
}
