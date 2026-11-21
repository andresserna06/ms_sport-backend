import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerController } from './controllers/player.controller';
import { Player } from './entities/player.entity';
import { PlayerMapper } from './mappers/player.mapper';
import {
  DefaultPlayerDependenciesChecker,
  PLAYER_DEPENDENCIES_CHECKER,
} from './repositories/player-dependencies.port';
import { PLAYER_REPOSITORY } from './repositories/player.repository';
import { PlayerTypeOrmRepository } from './repositories/player.typeorm.repository';
import { PlayerService } from './services/player.service';

@Module({
  imports: [TypeOrmModule.forFeature([Player])],
  controllers: [PlayerController],
  providers: [
    PlayerService,
    PlayerMapper,
    {
      provide: PLAYER_REPOSITORY,
      useClass: PlayerTypeOrmRepository,
    },
    {
      provide: PLAYER_DEPENDENCIES_CHECKER,
      useClass: DefaultPlayerDependenciesChecker,
    },
  ],
  exports: [PlayerService],
})
export class PlayersModule {}
