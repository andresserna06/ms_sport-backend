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
import { PlayerController } from './controllers/player.controller';
import { Player } from './entities/player.entity';
import { PlayerMapper } from './mappers/player.mapper';
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
      provide: PLAYER_DEPENDENCIES_CHECKER,
      useFactory: (
        skillChecker: PlayerDependenciesChecker,
        contractChecker: PlayerDependenciesChecker,
      ): PlayerDependenciesChecker => ({
        async hasAssociatedRecords(playerId: number): Promise<boolean> {
          const [hasSkills, hasContracts] = await Promise.all([
            skillChecker.hasAssociatedRecords(playerId),
            contractChecker.hasAssociatedRecords(playerId),
          ]);
          return hasSkills || hasContracts;
        },
      }),
      inject: [
        PLAYER_SKILL_DEPENDENCY_CHECKER,
        PLAYER_CONTRACT_DEPENDENCY_CHECKER,
      ],
    },
  ],
  exports: [PlayerService],
})
export class PlayersModule {}
