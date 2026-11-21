import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phase } from '../phases/base/entities/phase.entity';
import { ScoringEventDependenciesModule } from '../scoring-events/scoring-event-dependencies.module';
import { TeamsModule } from '../teams/teams.module';
import { Match } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchesRepository } from './repositories/matches.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Phase]),
    TeamsModule,
    ScoringEventDependenciesModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService, MatchMapper, MatchesRepository],
  exports: [MatchesService, MatchMapper],
})
export class MatchesModule {}
