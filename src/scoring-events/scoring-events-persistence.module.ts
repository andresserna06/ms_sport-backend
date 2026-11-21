import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoringEvent } from './entities/scoring-event.entity';
import { SCORING_EVENT_REPOSITORY } from './repositories/scoring-event.repository';
import { ScoringEventTypeOrmRepository } from './repositories/scoring-event.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ScoringEvent])],
  providers: [
    {
      provide: SCORING_EVENT_REPOSITORY,
      useClass: ScoringEventTypeOrmRepository,
    },
  ],
  exports: [SCORING_EVENT_REPOSITORY],
})
export class ScoringEventsPersistenceModule {}
