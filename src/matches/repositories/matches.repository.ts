import { Match, MatchStatus } from '../entities/match.entity';

export const MATCH_REPOSITORY = Symbol('MATCH_REPOSITORY');

export interface MatchRepository {
  findById(id: number): Promise<Match | null>;
  findAll(filters?: { tournamentId?: number; phaseId?: number }): Promise<Match[]>;
  findByPhase(phaseId: number): Promise<Match[]>;
  save(match: Match): Promise<Match>;
  remove(match: Match): Promise<void>;
}
