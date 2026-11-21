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
  // Nothing exports yet: HU-GD-03 exports TeamsService when it needs it.
})
export class TeamsModule {}
