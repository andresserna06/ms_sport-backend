import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportsController } from './controllers/sports.controller';
import { Sport } from './entities/sport.entity';
import { SportMapper } from './mappers/sport.mapper';
import { SPORT_REPOSITORY } from './repositories/sport.repository';
import { SportTypeOrmRepository } from './repositories/sport.typeorm.repository';
import { SportsService } from './services/sports.service';

// SportsService is exported for HU-GD-03 (team-sports) and HU-GC-01
// (tournaments), which validate that a sport exists and is active.
@Module({
  imports: [TypeOrmModule.forFeature([Sport])],
  controllers: [SportsController],
  providers: [
    SportsService,
    SportMapper,
    { provide: SPORT_REPOSITORY, useClass: SportTypeOrmRepository },
  ],
  exports: [SportsService],
})
export class SportsModule {}
