import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerSkillDependenciesModule } from '../player-skills/player-skill-dependencies.module';
import { PlayerController } from './controllers/player.controller';
import { Player } from './entities/player.entity';
import { PlayerMapper } from './mappers/player.mapper';
import { PLAYER_REPOSITORY } from './repositories/player.repository';
import { PlayerTypeOrmRepository } from './repositories/player.typeorm.repository';
import { PlayerService } from './services/player.service';

@Module({
  imports: [TypeOrmModule.forFeature([Player]), PlayerSkillDependenciesModule],
  controllers: [PlayerController],
  providers: [
    PlayerService,
    PlayerMapper,
    {
      provide: PLAYER_REPOSITORY,
      useClass: PlayerTypeOrmRepository,
    },
  ],
  exports: [PlayerService],
})
export class PlayersModule {}
