import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { PhasesModule } from '../phases/base/phases.module';
import { GroupModule } from '../phases/group/group.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { TeamsModule } from '../teams/teams.module';
import { TournamentVenuesModule } from '../tournament-venues/tournament-venues.module';
import { VenuesModule } from '../venues/venues.module';
import { MatchDependenciesModule } from './match-dependencies.module';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { PhaseMatchesController } from './controllers/phase-matches.controller';
import { MATCH_REPOSITORY } from './repositories/matches.repository';
import { MatchTypeOrmRepository } from './repositories/matches.typeorm.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match]),
    forwardRef(() => PhasesModule),
    GroupModule,
    RegistrationsModule,
    TeamsModule,
    MatchDependenciesModule,
    NotificationsModule,
    VenuesModule,
    TournamentVenuesModule,
  ],
  controllers: [MatchesController, PhaseMatchesController],
  providers: [
    MatchesService,
    MatchMapper,
    { provide: MATCH_REPOSITORY, useClass: MatchTypeOrmRepository },
  ],
  exports: [MatchesService, MatchMapper],
})
export class MatchesModule {}
