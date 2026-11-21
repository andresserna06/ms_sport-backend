import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerSkill } from '../entities/player-skill.entity';
import { PlayerSkillRepository } from './player-skill.repository';

@Injectable()
export class PlayerSkillTypeOrmRepository implements PlayerSkillRepository {
  constructor(
    @InjectRepository(PlayerSkill)
    private readonly orm: Repository<PlayerSkill>,
  ) {}

  async findByPlayerAndSkill(
    playerId: number,
    skillId: number,
  ): Promise<PlayerSkill | null> {
    return this.orm.findOne({ where: { playerId, skillId } });
  }

  async findSkillsByPlayerId(playerId: number): Promise<PlayerSkill[]> {
    return this.orm.find({
      where: { playerId },
      relations: { skill: true },
      order: { id: 'ASC' },
    });
  }

  async findPlayersBySkillId(skillId: number): Promise<PlayerSkill[]> {
    return this.orm.find({
      where: { skillId },
      relations: { player: true },
      order: { id: 'ASC' },
    });
  }

  async existsByPlayerId(playerId: number): Promise<boolean> {
    return (await this.orm.count({ where: { playerId } })) > 0;
  }

  async existsBySkillId(skillId: number): Promise<boolean> {
    return (await this.orm.count({ where: { skillId } })) > 0;
  }

  async save(playerSkill: PlayerSkill): Promise<PlayerSkill> {
    return this.orm.save(playerSkill);
  }

  async remove(playerSkill: PlayerSkill): Promise<void> {
    await this.orm.remove(playerSkill);
  }
}
