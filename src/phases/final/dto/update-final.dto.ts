import { IsEnum, IsOptional } from 'class-validator';
import { FinalRound } from '../../base/entities/phase.entity';
import { UpdatePhaseRequestDto } from '../../base/dto/update-phase-request.dto';

export class UpdateFinalDto extends UpdatePhaseRequestDto {
  @IsOptional()
  @IsEnum(FinalRound)
  finalRound?: FinalRound;
}
