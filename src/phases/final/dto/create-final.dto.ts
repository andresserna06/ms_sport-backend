import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { FinalRound } from '../../base/entities/phase.entity';

export class CreateFinalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsInt()
  @Min(1)
  tournamentId!: number;

  @IsEnum(FinalRound)
  finalRound!: FinalRound;
}
