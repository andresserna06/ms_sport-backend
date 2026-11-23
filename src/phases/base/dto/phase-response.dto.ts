import { MatchResponseDto } from '../../../matches/dto/match-response.dto';
import { FinalRound } from '../entities/phase.entity';

export class PhaseResponseDto {
  id!: number;
  name!: string;
  order!: number;
  tournamentId!: number | null;
  phaseType!: 'GROUP' | 'FINAL';
  finalRound!: FinalRound | null;
  matches?: MatchResponseDto[];
}
