import { Module } from '@nestjs/common';
import { MATCH_DEPENDENCIES_CHECKER } from '../matches/repositories/match-dependencies.port';
import {
  SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER,
  ScoringEventMatchDependenciesAdapter,
  ScoringEventPlayerDependenciesAdapter,
} from './repositories/scoring-event-dependencies.adapter';
import { ScoringEventsPersistenceModule } from './scoring-events-persistence.module';

export { SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER };

@Module({
  imports: [ScoringEventsPersistenceModule],
  providers: [
    {
      provide: SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER,
      useClass: ScoringEventPlayerDependenciesAdapter,
    },
    {
      provide: MATCH_DEPENDENCIES_CHECKER,
      useClass: ScoringEventMatchDependenciesAdapter,
    },
  ],
  exports: [
    SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER,
    MATCH_DEPENDENCIES_CHECKER,
  ],
})
export class ScoringEventDependenciesModule {}
