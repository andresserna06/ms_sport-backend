import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../../matches/entities/match.entity';
import { MatchesModule } from '../../matches/matches.module';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesController } from './phases.controller';
import { PhasesService } from './phases.service';
import { PhasesRepository } from './repositories/phases.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Phase, Match]),
    forwardRef(() => MatchesModule),
  ],
  controllers: [PhasesController],
  providers: [PhasesService, PhaseMapper, PhasesRepository],
  exports: [PhasesService],
})
export class PhasesModule {}
