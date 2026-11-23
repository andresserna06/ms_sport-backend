import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatingZonesController } from './controllers/seating-zones.controller';
import { SeatingZone } from './entities/seating-zone.entity';
import { SeatingZoneMapper } from './mappers/seating-zone.mapper';
import { SEATING_ZONES_REPOSITORY } from './repositories/seating-zone.repository';
import { SeatingZoneTypeOrmRepository } from './repositories/seating-zone.typeorm.repository';
import { SeatingZonesService } from './services/seating-zones.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [TypeOrmModule.forFeature([SeatingZone])],
  controllers: [SeatingZonesController],
  providers: [
    SeatingZonesService,
    SeatingZoneMapper,
    {
      provide: SEATING_ZONES_REPOSITORY,
      useClass: SeatingZoneTypeOrmRepository,
    },
  ],
  exports: [SeatingZonesService],
})
export class SeatingZonesModule {}
