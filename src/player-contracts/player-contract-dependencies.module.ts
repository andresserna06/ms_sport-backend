import { Module } from '@nestjs/common';
import { PlayerContractsPersistenceModule } from './player-contracts-persistence.module';
import {
  PLAYER_CONTRACT_DEPENDENCY_CHECKER,
  PlayerContractPlayerDependenciesAdapter,
} from './repositories/player-contract-dependencies.adapter';

export { PLAYER_CONTRACT_DEPENDENCY_CHECKER };

@Module({
  imports: [PlayerContractsPersistenceModule],
  providers: [
    {
      provide: PLAYER_CONTRACT_DEPENDENCY_CHECKER,
      useClass: PlayerContractPlayerDependenciesAdapter,
    },
  ],
  exports: [PLAYER_CONTRACT_DEPENDENCY_CHECKER],
})
export class PlayerContractDependenciesModule {}
