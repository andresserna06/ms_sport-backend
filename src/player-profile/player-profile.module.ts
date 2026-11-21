import { Module } from '@nestjs/common';
import { PlayerContractsModule } from '../player-contracts/player-contracts.module';
import { PlayerSkillsModule } from '../player-skills/player-skills.module';
import { PlayersModule } from '../players/players.module';
import { PlayerProfileController } from './controllers/player-profile.controller';
import { PlayerProfileMapper } from './mappers/player-profile.mapper';
import { PlayerProfileService } from './services/player-profile.service';

@Module({
  imports: [PlayersModule, PlayerContractsModule, PlayerSkillsModule],
  controllers: [PlayerProfileController],
  providers: [PlayerProfileService, PlayerProfileMapper],
  exports: [PlayerProfileService],
})
export class PlayerProfileModule {}
