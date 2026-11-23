import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenuesController } from './controllers/venues.controller';
import { Venue } from './entities/venue.entity';
import { VenueMapper } from './mappers/venue.mapper';
import { VENUES_REPOSITORY } from './repositories/venue.repository';
import { VenueTypeOrmRepository } from './repositories/venue.typeorm.repository';
import { VenuesService } from './services/venues.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [TypeOrmModule.forFeature([Venue])],
  controllers: [VenuesController],
  providers: [
    VenuesService,
    VenueMapper,
    { provide: VENUES_REPOSITORY, useClass: VenueTypeOrmRepository },
  ],
  exports: [VenuesService],
})
export class VenuesModule {}
