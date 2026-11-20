import { MatchStatus } from '../entities/match.entity';

export class MatchResponseDto {
  id!: number;
  scheduledAt!: Date;
  status!: MatchStatus;
  homeScore!: number | null;
  awayScore!: number | null;
}
