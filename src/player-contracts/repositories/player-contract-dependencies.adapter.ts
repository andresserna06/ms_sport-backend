import { Inject, Injectable } from '@nestjs/common';
import { type PlayerDependenciesChecker } from '../../players/repositories/player-dependencies.port';
import {
  PLAYER_CONTRACT_REPOSITORY,
  type PlayerContractRepository,
} from './player-contract.repository';

export const PLAYER_CONTRACT_DEPENDENCY_CHECKER = Symbol(
  'PLAYER_CONTRACT_DEPENDENCY_CHECKER',
);

@Injectable()
export class PlayerContractPlayerDependenciesAdapter
  implements PlayerDependenciesChecker
{
  constructor(
    @Inject(PLAYER_CONTRACT_REPOSITORY)
    private readonly contractRepository: PlayerContractRepository,
  ) {}

  async hasAssociatedRecords(playerId: number): Promise<boolean> {
    return this.contractRepository.existsByPlayerId(playerId);
  }
}
