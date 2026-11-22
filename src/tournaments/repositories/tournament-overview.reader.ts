export const TOURNAMENT_OVERVIEW_READER = Symbol('TOURNAMENT_OVERVIEW_READER');

export interface OverviewPhaseRow {
  id: number;
  name: string;
  order: number;
  phaseType: 'GROUP' | 'FINAL';
}

export interface OverviewMatchRow {
  id: number;
  phaseId: number;
  scheduledAt: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: number; name: string } | null;
  awayTeam: { id: number; name: string } | null;
}

export interface OverviewScoringEventRow {
  id: number;
  matchId: number;
  minute: number;
  type: string;
  player: { id: number; document: string };
  team: { id: number; name: string };
}

// Read-only port used by the tournament overview (HU-GC-08). It keeps the
// tournaments service free of the phases, matches and scoring-events
// repositories, and every method is one batched query (no N+1).
export interface TournamentOverviewReader {
  // Phases of the tournament, in competition order.
  findPhases(tournamentId: number): Promise<OverviewPhaseRow[]>;
  // Matches of those phases, with both teams, by schedule.
  findMatches(phaseIds: number[]): Promise<OverviewMatchRow[]>;
  // Scoring events of those matches, with player and team, by minute.
  findScoringEvents(matchIds: number[]): Promise<OverviewScoringEventRow[]>;
}
