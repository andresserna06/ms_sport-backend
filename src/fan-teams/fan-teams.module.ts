import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FanTeamsController } from './controllers/fan-teams.controller';
import { FanTeam } from './entities/fan-team.entity';
import { FanTeamMapper } from './mappers/fan-team.mapper';
import { FAN_TEAMS_REPOSITORY } from './repositories/fan-team.repository';
import { FanTeamTypeOrmRepository } from './repositories/fan-team.typeorm.repository';
import { FanTeamsService } from './services/fan-teams.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [TypeOrmModule.forFeature([FanTeam])],
  controllers: [FanTeamsController],
  providers: [
    FanTeamsService,
    FanTeamMapper,
    { provide: FAN_TEAMS_REPOSITORY, useClass: FanTeamTypeOrmRepository },
  ],
  exports: [FanTeamsService],
})
export class FanTeamsModule {}
