import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerContract } from '../entities/player-contract.entity';
import { PlayerContractRepository } from './player-contract.repository';

@Injectable()
export class PlayerContractTypeOrmRepository
  implements PlayerContractRepository
{
  constructor(
    @InjectRepository(PlayerContract)
    private readonly orm: Repository<PlayerContract>,
  ) {}

  async findById(id: number): Promise<PlayerContract | null> {
    return this.orm.findOne({ where: { id } });
  }

  async findByPlayerAndTeam(
    playerId: number,
    teamId: number,
  ): Promise<PlayerContract[]> {
    return this.orm.find({
      where: { playerId, teamId },
      order: { id: 'ASC' },
    });
  }

  async findByTeamId(teamId: number): Promise<PlayerContract[]> {
    return this.orm.find({
      where: { teamId },
      relations: { player: true },
      order: { id: 'ASC' },
    });
  }

  async findByPlayerId(playerId: number): Promise<PlayerContract[]> {
    return this.orm.find({
      where: { playerId },
      relations: { team: true },
      order: { id: 'ASC' },
    });
  }

  async existsByPlayerId(playerId: number): Promise<boolean> {
    return (await this.orm.count({ where: { playerId } })) > 0;
  }

  async save(contract: PlayerContract): Promise<PlayerContract> {
    return this.orm.save(contract);
  }
}
