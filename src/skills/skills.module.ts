import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerSkillDependenciesModule } from '../player-skills/player-skill-dependencies.module';
import { SkillController } from './controllers/skill.controller';
import { Skill } from './entities/skill.entity';
import { SkillMapper } from './mappers/skill.mapper';
import { SKILL_REPOSITORY } from './repositories/skill.repository';
import { SkillTypeOrmRepository } from './repositories/skill.typeorm.repository';
import { SkillService } from './services/skill.service';

@Module({
  imports: [TypeOrmModule.forFeature([Skill]), PlayerSkillDependenciesModule],
  controllers: [SkillController],
  providers: [
    SkillService,
    SkillMapper,
    {
      provide: SKILL_REPOSITORY,
      useClass: SkillTypeOrmRepository,
    },
  ],
  exports: [SkillService],
})
export class SkillsModule {}
