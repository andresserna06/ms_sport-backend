import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phase } from '../phases/base/entities/phase.entity';
import { Match } from './entities/match.entity';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchMapper } from './mappers/match.mapper';
import { MatchesRepository } from './repositories/matches.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Phase])],
  controllers: [MatchesController],
  providers: [MatchesService, MatchMapper, MatchesRepository],
  exports: [MatchesService, MatchMapper],
})
export class MatchesModule {}
