import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BallsModule } from '../balls/balls.module';
import { MatchesModule } from '../matches/matches.module';
import { SpatialPositionsController } from './controllers/spatial-positions.controller';
import { SpatialPosition } from './entities/spatial-position.entity';
import { SpatialPositionMapper } from './mappers/spatial-position.mapper';
import { SPATIAL_POSITIONS_REPOSITORY } from './repositories/spatial-position.repository';
import { SpatialPositionTypeOrmRepository } from './repositories/spatial-position.typeorm.repository';
import { SpatialPositionsService } from './services/spatial-positions.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [
    TypeOrmModule.forFeature([SpatialPosition]),
    BallsModule,
    MatchesModule,
  ],
  controllers: [SpatialPositionsController],
  providers: [
    SpatialPositionsService,
    SpatialPositionMapper,
    {
      provide: SPATIAL_POSITIONS_REPOSITORY,
      useClass: SpatialPositionTypeOrmRepository,
    },
  ],
  exports: [SpatialPositionsService],
})
export class SpatialPositionsModule {}
