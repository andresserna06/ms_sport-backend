import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesController } from './phases.controller';
import { PhasesService } from './phases.service';
import { PhasesRepository } from './repositories/phases.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Phase])],
  controllers: [PhasesController],
  providers: [PhasesService, PhaseMapper, PhasesRepository],
  exports: [PhasesService],
})
export class PhasesModule {}
