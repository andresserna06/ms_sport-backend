import { MatchResponseDto } from '../../../matches/dto/match-response.dto';

export class PhaseResponseDto {
  id!: number;
  name!: string;
  order!: number;
  phaseType!: 'GROUP' | 'FINAL';
  matches?: MatchResponseDto[];
}
