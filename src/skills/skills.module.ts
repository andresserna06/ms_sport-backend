import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillController } from './controllers/skill.controller';
import { Skill } from './entities/skill.entity';
import { SkillMapper } from './mappers/skill.mapper';
import {
  DefaultSkillDependenciesChecker,
  SKILL_DEPENDENCIES_CHECKER,
} from './repositories/skill-dependencies.port';
import { SKILL_REPOSITORY } from './repositories/skill.repository';
import { SkillTypeOrmRepository } from './repositories/skill.typeorm.repository';
import { SkillService } from './services/skill.service';

@Module({
  imports: [TypeOrmModule.forFeature([Skill])],
  controllers: [SkillController],
  providers: [
    SkillService,
    SkillMapper,
    {
      provide: SKILL_REPOSITORY,
      useClass: SkillTypeOrmRepository,
    },
    {
      provide: SKILL_DEPENDENCIES_CHECKER,
      useClass: DefaultSkillDependenciesChecker,
    },
  ],
  exports: [SkillService],
})
export class SkillsModule {}
