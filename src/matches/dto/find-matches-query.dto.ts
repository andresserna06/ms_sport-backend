import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class FindMatchesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tournamentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  phaseId?: number;
}
