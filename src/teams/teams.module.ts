import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamsController } from './controllers/teams.controller';
import { Team } from './entities/team.entity';
import { TeamMapper } from './mappers/team.mapper';
import { TEAM_REPOSITORY } from './repositories/team.repository';
import { TeamTypeOrmRepository } from './repositories/team.typeorm.repository';
import { TeamsService } from './services/teams.service';

@Module({
  imports: [TypeOrmModule.forFeature([Team])],
  controllers: [TeamsController],
  providers: [
    TeamsService,
    TeamMapper,
    { provide: TEAM_REPOSITORY, useClass: TeamTypeOrmRepository },
  ],
  // Matches, player contracts and scoring events use TeamsService / TeamMapper.
  exports: [TeamsService, TeamMapper],
})
export class TeamsModule {}
