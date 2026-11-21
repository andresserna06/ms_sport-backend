import { PlayerSkill } from '../entities/player-skill.entity';

export const PLAYER_SKILL_REPOSITORY = Symbol('PLAYER_SKILL_REPOSITORY');

export interface PlayerSkillRepository {
  findByPlayerAndSkill(
    playerId: number,
    skillId: number,
  ): Promise<PlayerSkill | null>;
  findSkillsByPlayerId(playerId: number): Promise<PlayerSkill[]>;
  findPlayersBySkillId(skillId: number): Promise<PlayerSkill[]>;
  existsByPlayerId(playerId: number): Promise<boolean>;
  existsBySkillId(skillId: number): Promise<boolean>;
  save(playerSkill: PlayerSkill): Promise<PlayerSkill>;
  remove(playerSkill: PlayerSkill): Promise<void>;
}
