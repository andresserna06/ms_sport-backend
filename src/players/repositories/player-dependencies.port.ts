import { Injectable } from '@nestjs/common';

export const PLAYER_DEPENDENCIES_CHECKER = Symbol(
  'PLAYER_DEPENDENCIES_CHECKER',
);

export interface PlayerDependenciesChecker {
  hasAssociatedRecords(playerId: number): Promise<boolean>;
}

@Injectable()
export class DefaultPlayerDependenciesChecker
  implements PlayerDependenciesChecker
{
  async hasAssociatedRecords(_playerId: number): Promise<boolean> {
    return false;
  }
}
