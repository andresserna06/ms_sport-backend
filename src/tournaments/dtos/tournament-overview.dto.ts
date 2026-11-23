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

// One row of the standings table of a group phase (PJ, PG, PE, PP, AF, AC, DIF, PTS).
export class OverviewStandingDto {
  position!: number;
  team!: OverviewTeamDto;
  played!: number;
  won!: number;
  drawn!: number;
  lost!: number;
  goalsFor!: number;
  goalsAgainst!: number;
  goalDifference!: number;
  points!: number;
}

// One crossing of a knockout phase (each final phase is one round of the bracket).
export class OverviewBracketMatchDto {
  matchId!: number;
  status!: string;
  homeTeam!: OverviewTeamDto | null;
  awayTeam!: OverviewTeamDto | null;
  homeScore!: number | null;
  awayScore!: number | null;
  // Only when the match is FINISHED and not drawn (the tie rule is pending).
  winner!: OverviewTeamDto | null;
}

export class OverviewPhaseDto {
  id!: number;
  name!: string;
  order!: number;
  type!: 'GROUP_STAGE' | 'KNOCKOUT';
  // Only in GROUP_STAGE phases.
  teams?: OverviewTeamDto[];
  standings?: OverviewStandingDto[];
  // Only in KNOCKOUT phases.
  bracket?: OverviewBracketMatchDto[];
  matches!: OverviewMatchDto[];
}

export class TournamentOverviewDto {
  tournament!: TournamentResponseDto;
  // Only present when the tournament has no phases yet.
  message?: string;
  phases!: OverviewPhaseDto[];
}
