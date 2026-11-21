import { ScoringEvent } from '../entities/scoring-event.entity';

export const SCORING_EVENT_REPOSITORY = Symbol('SCORING_EVENT_REPOSITORY');

export interface ScoringEventRepository {
  findById(id: number): Promise<ScoringEvent | null>;
  findByMatchId(matchId: number): Promise<ScoringEvent[]>;
  existsByPlayerId(playerId: number): Promise<boolean>;
  existsByMatchId(matchId: number): Promise<boolean>;
  save(event: ScoringEvent): Promise<ScoringEvent>;
  remove(event: ScoringEvent): Promise<void>;
}
