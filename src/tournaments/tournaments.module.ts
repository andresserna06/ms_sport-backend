import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportsModule } from '../sports/sports.module';
import { TournamentsController } from './controllers/tournaments.controller';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TOURNAMENT_REPOSITORY } from './repositories/tournament.repository';
import { TournamentTypeOrmRepository } from './repositories/tournament.typeorm.repository';
import { TournamentsService } from './services/tournaments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament]), SportsModule],
  controllers: [TournamentsController],
  providers: [
    TournamentsService,
    TournamentMapper,
    { provide: TOURNAMENT_REPOSITORY, useClass: TournamentTypeOrmRepository },
  ],
  exports: [TournamentsService, TournamentMapper],
})
export class TournamentsModule {}
