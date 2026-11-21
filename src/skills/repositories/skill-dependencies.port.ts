import { Injectable } from '@nestjs/common';

export const SKILL_DEPENDENCIES_CHECKER = Symbol('SKILL_DEPENDENCIES_CHECKER');

export interface SkillDependenciesChecker {
  hasAssociatedPlayers(skillId: number): Promise<boolean>;
}

@Injectable()
export class DefaultSkillDependenciesChecker
  implements SkillDependenciesChecker
{
  async hasAssociatedPlayers(_skillId: number): Promise<boolean> {
    return false;
  }
}
