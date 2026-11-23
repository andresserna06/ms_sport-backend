import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bet } from '../bets/entities/bet.entity';
import { ScoringEventsPersistenceModule } from '../scoring-events/scoring-events-persistence.module';
import { Ticket } from '../tickets/entities/ticket.entity';
import { MATCH_DEPENDENCIES_CHECKER } from './repositories/match-dependencies.port';
import { MatchDependenciesAdapter } from './repositories/match-dependencies.typeorm.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Bet]),
    ScoringEventsPersistenceModule,
  ],
  providers: [
    { provide: MATCH_DEPENDENCIES_CHECKER, useClass: MatchDependenciesAdapter },
  ],
  exports: [MATCH_DEPENDENCIES_CHECKER],
})
export class MatchDependenciesModule {}
