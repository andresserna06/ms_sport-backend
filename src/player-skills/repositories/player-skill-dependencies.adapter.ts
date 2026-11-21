import { Inject, Injectable } from '@nestjs/common';
import { type PlayerDependenciesChecker } from '../../players/repositories/player-dependencies.port';
import { type SkillDependenciesChecker } from '../../skills/repositories/skill-dependencies.port';
import {
  PLAYER_SKILL_REPOSITORY,
  type PlayerSkillRepository,
} from './player-skill.repository';

@Injectable()
export class PlayerSkillSkillDependenciesAdapter
  implements SkillDependenciesChecker
{
  constructor(
    @Inject(PLAYER_SKILL_REPOSITORY)
    private readonly playerSkillRepository: PlayerSkillRepository,
  ) {}

  async hasAssociatedPlayers(skillId: number): Promise<boolean> {
    return this.playerSkillRepository.existsBySkillId(skillId);
  }
}

@Injectable()
export class PlayerSkillPlayerDependenciesAdapter
  implements PlayerDependenciesChecker
{
  constructor(
    @Inject(PLAYER_SKILL_REPOSITORY)
    private readonly playerSkillRepository: PlayerSkillRepository,
  ) {}

  async hasAssociatedRecords(playerId: number): Promise<boolean> {
    return this.playerSkillRepository.existsByPlayerId(playerId);
  }
}
