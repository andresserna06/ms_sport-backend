import { TournamentResponseDto } from './tournament-response.dto';

export class OverviewTeamDto {
  id!: number;
  name!: string;
}

export class OverviewScoringEventDto {
  id!: number;
  minute!: number;
  type!: string;
  player!: { id: number; document: string };
  team!: OverviewTeamDto;
}

export class OverviewMatchDto {
  id!: number;
  scheduledAt!: string;
  status!: string;
  // True when the score has been recorded; false while it is still pending.
  hasResult!: boolean;
  homeTeam!: OverviewTeamDto | null;
  awayTeam!: OverviewTeamDto | null;
  homeScore!: number | null;
  awayScore!: number | null;
  scoringEvents!: OverviewScoringEventDto[];
}

export class OverviewPhaseDto {
  id!: number;
  name!: string;
  order!: number;
  type!: 'GROUP_STAGE' | 'KNOCKOUT';
  matches!: OverviewMatchDto[];
}

export class TournamentOverviewDto {
  tournament!: TournamentResponseDto;
  // Only present when the tournament has no phases yet.
  message?: string;
  phases!: OverviewPhaseDto[];
}
