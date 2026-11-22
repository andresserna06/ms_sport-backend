import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportsModule } from '../sports/sports.module';
import { TeamsModule } from '../teams/teams.module';
import { TeamSportsController } from './controllers/team-sports.controller';
import { TeamSport } from './entities/team-sport.entity';
import { TeamSportMapper } from './mappers/team-sport.mapper';
import { TEAM_SPORT_REPOSITORY } from './repositories/team-sport.repository';
import { TeamSportTypeOrmRepository } from './repositories/team-sport.typeorm.repository';
import { TeamSportsService } from './services/team-sports.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamSport]), TeamsModule, SportsModule],
  controllers: [TeamSportsController],
  providers: [
    TeamSportsService,
    TeamSportMapper,
    { provide: TEAM_SPORT_REPOSITORY, useClass: TeamSportTypeOrmRepository },
  ],
})
export class TeamSportsModule {}
