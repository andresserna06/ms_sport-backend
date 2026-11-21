import { MatchResponseDto } from '../../../matches/dto/match-response.dto';

export class PhaseResponseDto {
  id!: number;
  name!: string;
  order!: number;
  tournamentId!: number | null;
  phaseType!: 'GROUP' | 'FINAL';
  matches?: MatchResponseDto[];
}
