import { IsEnum } from 'class-validator';
import { PhaseRequestDto } from '../../base/dto/phase-request.dto';
import { FinalRound } from '../../base/entities/phase.entity';

export class CreateFinalDto extends PhaseRequestDto {
  @IsEnum(FinalRound)
  finalRound!: FinalRound;
}
