import { PlayerContract } from '../entities/player-contract.entity';

export const PLAYER_CONTRACT_REPOSITORY = Symbol('PLAYER_CONTRACT_REPOSITORY');

export interface PlayerContractRepository {
  findById(id: number): Promise<PlayerContract | null>;
  findByPlayerAndTeam(
    playerId: number,
    teamId: number,
  ): Promise<PlayerContract[]>;
  findByTeamId(teamId: number): Promise<PlayerContract[]>;
  findByPlayerId(playerId: number): Promise<PlayerContract[]>;
  existsByPlayerId(playerId: number): Promise<boolean>;
  save(contract: PlayerContract): Promise<PlayerContract>;
}
