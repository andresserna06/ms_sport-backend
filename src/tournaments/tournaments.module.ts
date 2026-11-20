import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from './entities/tournament.entity';
import { TournamentMapper } from './mappers/tournament.mapper';
import { TournamentsController } from './tournaments.controller';
import { TournamentsRepository } from './repositories/tournaments.repository';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament])],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentMapper, TournamentsRepository],
  exports: [TournamentsService, TournamentMapper],
})
export class TournamentsModule {}
