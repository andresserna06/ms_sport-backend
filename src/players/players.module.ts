import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PLAYER_CONTRACT_DEPENDENCY_CHECKER,
  PlayerContractDependenciesModule,
} from '../player-contracts/player-contract-dependencies.module';
import {
  PLAYER_SKILL_DEPENDENCY_CHECKER,
  PlayerSkillDependenciesModule,
} from '../player-skills/player-skill-dependencies.module';
import {
  SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER,
  ScoringEventDependenciesModule,
} from '../scoring-events/scoring-event-dependencies.module';
import { HttpSecurityRoleAssignerClient } from './clients/http-security-role-assigner.client';
import { PlayerController } from './controllers/player.controller';
import { Player } from './entities/player.entity';
import { PlayerMapper } from './mappers/player.mapper';
import { PLAYER_ROLE_ASSIGNER } from './ports/player-role-assigner.port';
import {
  PLAYER_DEPENDENCIES_CHECKER,
  type PlayerDependenciesChecker,
} from './repositories/player-dependencies.port';
import { PLAYER_REPOSITORY } from './repositories/player.repository';
import { PlayerTypeOrmRepository } from './repositories/player.typeorm.repository';
import { PlayerService } from './services/player.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    PlayerSkillDependenciesModule,
    PlayerContractDependenciesModule,
    ScoringEventDependenciesModule,
  ],
  controllers: [PlayerController],
  providers: [
    PlayerService,
    PlayerMapper,
    {
      provide: PLAYER_REPOSITORY,
      useClass: PlayerTypeOrmRepository,
    },
    {
      provide: PLAYER_ROLE_ASSIGNER,
      useClass: HttpSecurityRoleAssignerClient,
    },
    {
      provide: PLAYER_DEPENDENCIES_CHECKER,
      useFactory: (
        skillChecker: PlayerDependenciesChecker,
        contractChecker: PlayerDependenciesChecker,
        scoringEventChecker: PlayerDependenciesChecker,
      ): PlayerDependenciesChecker => ({
        async hasAssociatedRecords(playerId: number): Promise<boolean> {
          const [hasSkills, hasContracts, hasScoringEvents] = await Promise.all(
            [
              skillChecker.hasAssociatedRecords(playerId),
              contractChecker.hasAssociatedRecords(playerId),
              scoringEventChecker.hasAssociatedRecords(playerId),
            ],
          );
          return hasSkills || hasContracts || hasScoringEvents;
        },
      }),
      inject: [
        PLAYER_SKILL_DEPENDENCY_CHECKER,
        PLAYER_CONTRACT_DEPENDENCY_CHECKER,
        SCORING_EVENT_PLAYER_DEPENDENCY_CHECKER,
      ],
    },
  ],
  exports: [PlayerService],
})
export class PlayersModule {}
