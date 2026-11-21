import { Module } from '@nestjs/common';
import { PLAYER_DEPENDENCIES_CHECKER } from '../players/repositories/player-dependencies.port';
import { SKILL_DEPENDENCIES_CHECKER } from '../skills/repositories/skill-dependencies.port';
import { PlayerSkillsPersistenceModule } from './player-skills-persistence.module';
import {
  PlayerSkillPlayerDependenciesAdapter,
  PlayerSkillSkillDependenciesAdapter,
} from './repositories/player-skill-dependencies.adapter';

@Module({
  imports: [PlayerSkillsPersistenceModule],
  providers: [
    {
      provide: SKILL_DEPENDENCIES_CHECKER,
      useClass: PlayerSkillSkillDependenciesAdapter,
    },
    {
      provide: PLAYER_DEPENDENCIES_CHECKER,
      useClass: PlayerSkillPlayerDependenciesAdapter,
    },
  ],
  exports: [SKILL_DEPENDENCIES_CHECKER, PLAYER_DEPENDENCIES_CHECKER],
})
export class PlayerSkillDependenciesModule {}
