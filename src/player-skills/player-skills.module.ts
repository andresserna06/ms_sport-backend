import { Module } from '@nestjs/common';
import { PlayersModule } from '../players/players.module';
import { SkillsModule } from '../skills/skills.module';
import { PlayerSkillController } from './controllers/player-skill.controller';
import { PlayerSkillMapper } from './mappers/player-skill.mapper';
import { PlayerSkillsPersistenceModule } from './player-skills-persistence.module';
import { PlayerSkillService } from './services/player-skill.service';

@Module({
  imports: [PlayerSkillsPersistenceModule, PlayersModule, SkillsModule],
  controllers: [PlayerSkillController],
  providers: [PlayerSkillService, PlayerSkillMapper],
  exports: [PlayerSkillService],
})
export class PlayerSkillsModule {}
