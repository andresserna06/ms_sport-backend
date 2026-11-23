import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentVenuesController } from './controllers/tournament-venues.controller';
import { TournamentVenue } from './entities/tournament-venue.entity';
import { TournamentVenueMapper } from './mappers/tournament-venue.mapper';
import { TOURNAMENT_VENUES_REPOSITORY } from './repositories/tournament-venue.repository';
import { TournamentVenueTypeOrmRepository } from './repositories/tournament-venue.typeorm.repository';
import { TournamentVenuesService } from './services/tournament-venues.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [TypeOrmModule.forFeature([TournamentVenue])],
  controllers: [TournamentVenuesController],
  providers: [
    TournamentVenuesService,
    TournamentVenueMapper,
    {
      provide: TOURNAMENT_VENUES_REPOSITORY,
      useClass: TournamentVenueTypeOrmRepository,
    },
  ],
  exports: [TournamentVenuesService],
})
export class TournamentVenuesModule {}
