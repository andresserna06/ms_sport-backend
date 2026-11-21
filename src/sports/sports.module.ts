import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportsController } from './controllers/sports.controller';
import { Sport } from './entities/sport.entity';
import { SportMapper } from './mappers/sport.mapper';
import { SPORT_REPOSITORY } from './repositories/sport.repository';
import { SportTypeOrmRepository } from './repositories/sport.typeorm.repository';
import { SportsService } from './services/sports.service';

// SportsService is not exported yet: it relies on the global ValidationPipe
// (trim). HU-GD-03 and HU-GC-01 export it when they need to validate sports.
@Module({
  imports: [TypeOrmModule.forFeature([Sport])],
  controllers: [SportsController],
  providers: [
    SportsService,
    SportMapper,
    { provide: SPORT_REPOSITORY, useClass: SportTypeOrmRepository },
  ],
})
export class SportsModule {}
