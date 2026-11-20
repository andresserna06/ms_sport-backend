import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamMapper } from './mappers/team.mapper';
import { TeamsController } from './teams.controller';
import { TeamsRepository } from './repositories/teams.repository';
import { TeamsService } from './teams.service';

@Module({
  imports: [TypeOrmModule.forFeature([Team])],
  controllers: [TeamsController],
  providers: [TeamsService, TeamMapper, TeamsRepository],
  exports: [TeamsService, TeamMapper],
})
export class TeamsModule {}
