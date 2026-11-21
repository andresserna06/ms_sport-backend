import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerSkill } from './entities/player-skill.entity';
import { PLAYER_SKILL_REPOSITORY } from './repositories/player-skill.repository';
import { PlayerSkillTypeOrmRepository } from './repositories/player-skill.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerSkill])],
  providers: [
    {
      provide: PLAYER_SKILL_REPOSITORY,
      useClass: PlayerSkillTypeOrmRepository,
    },
  ],
  exports: [PLAYER_SKILL_REPOSITORY],
})
export class PlayerSkillsPersistenceModule {}
