import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlayerContractsModule } from '../player-contracts/player-contracts.module';
import { PlayersModule } from '../players/players.module';
import { TeamsModule } from '../teams/teams.module';
import { MatchResultsController } from './controllers/match-results.controller';
import { ScoringEventMapper } from './mappers/scoring-event.mapper';
import { ScoringEventsPersistenceModule } from './scoring-events-persistence.module';
import { MatchResultsService } from './services/match-results.service';

@Module({
  imports: [
    ScoringEventsPersistenceModule,
    MatchesModule,
    PlayersModule,
    TeamsModule,
    PlayerContractsModule,
    NotificationsModule,
  ],
  controllers: [MatchResultsController],
  providers: [MatchResultsService, ScoringEventMapper],
  exports: [MatchResultsService],
})
export class ScoringEventsModule {}
