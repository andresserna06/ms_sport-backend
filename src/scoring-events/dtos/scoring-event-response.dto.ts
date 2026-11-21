export class ScoringEventPlayerSummaryDto {
  id!: number;
  document!: string;
  position!: string | null;
  jerseyNumber!: number | null;
}

export class ScoringEventTeamSummaryDto {
  id!: number;
  name!: string;
}

export class ScoringEventResponseDto {
  id!: number;
  matchId!: number;
  playerId!: number;
  teamId!: number;
  minute!: number;
  type!: string;
  player?: ScoringEventPlayerSummaryDto;
  team?: ScoringEventTeamSummaryDto;
}
