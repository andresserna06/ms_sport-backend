import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { FinalRound } from '../../base/entities/phase.entity';

export class UpdateFinalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsEnum(FinalRound)
  finalRound?: FinalRound;
}
