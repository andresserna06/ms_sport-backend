import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/entities/match.entity';
import { Group } from '../phases/group/entities/group.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentRegistrationsController } from './controllers/tournament-registrations.controller';
import { TeamRegistrationsController } from './controllers/team-registrations.controller';
import { Registration } from './entities/registration.entity';
import { RegistrationMapper } from './mappers/registration.mapper';
import {
  REGISTRATION_REPOSITORY,
  RegistrationTypeOrmRepository,
} from './repositories/registrations.repository';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Registration,
      Team,
      Tournament,
      Group,
      Match,
      TeamSport,
    ]),
  ],
  controllers: [TournamentRegistrationsController, TeamRegistrationsController],
  providers: [
    RegistrationsService,
    RegistrationMapper,
    { provide: REGISTRATION_REPOSITORY, useClass: RegistrationTypeOrmRepository },
  ],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
