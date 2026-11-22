import { Inject, Injectable } from '@nestjs/common';
import { type MatchDependenciesChecker } from '../../matches/repositories/match-dependencies.port';
import { type PlayerDependenciesChecker } from '../../players/repositories/player-dependencies.port';
import {
  SCORING_EVENT_REPOSITORY,
  type ScoringEventRepository,
} from './scoring-event.repository';

export const SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER = Symbol(
  'SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER',
);

@Injectable()
export class ScoringEventPlayerDependenciesAdapter
  implements PlayerDependenciesChecker
{
  constructor(
    @Inject(SCORING_EVENT_REPOSITORY)
    private readonly scoringEventRepository: ScoringEventRepository,
  ) {}

  async hasAssociatedRecords(playerId: number): Promise<boolean> {
    return this.scoringEventRepository.existsByPlayerId(playerId);
  }
}

@Injectable()
export class ScoringEventMatchDependenciesAdapter
  implements MatchDependenciesChecker
{
  constructor(
    @Inject(SCORING_EVENT_REPOSITORY)
    private readonly scoringEventRepository: ScoringEventRepository,
  ) {}

  async hasScoringEvents(matchId: number): Promise<boolean> {
    return this.scoringEventRepository.existsByMatchId(matchId);
  }

  async hasBlockingDependencies(matchId: number): Promise<boolean> {
    return this.hasScoringEvents(matchId);
  }
}
