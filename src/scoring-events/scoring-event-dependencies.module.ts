import { Module } from '@nestjs/common';
import {
  SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER,
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
  ],
  exports: [SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER],
})
export class ScoringEventDependenciesModule {}
