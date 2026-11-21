import { Module } from '@nestjs/common';
import { SKILL_DEPENDENCIES_CHECKER } from '../skills/repositories/skill-dependencies.port';
import { PlayerSkillsPersistenceModule } from './player-skills-persistence.module';
import {
  PlayerSkillPlayerDependenciesAdapter,
  PlayerSkillSkillDependenciesAdapter,
} from './repositories/player-skill-dependencies.adapter';

export const PLAYER_SKILL_DEPENDENCY_CHECKER = Symbol(
  'PLAYER_SKILL_DEPENDENCY_CHECKER',
);

@Module({
  imports: [PlayerSkillsPersistenceModule],
  providers: [
    {
      provide: SKILL_DEPENDENCIES_CHECKER,
      useClass: PlayerSkillSkillDependenciesAdapter,
    },
    {
      provide: PLAYER_SKILL_DEPENDENCY_CHECKER,
      useClass: PlayerSkillPlayerDependenciesAdapter,
    },
  ],
  exports: [SKILL_DEPENDENCIES_CHECKER, PLAYER_SKILL_DEPENDENCY_CHECKER],
})
export class PlayerSkillDependenciesModule {}
