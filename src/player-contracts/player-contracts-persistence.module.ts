import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerContract } from './entities/player-contract.entity';
import { PLAYER_CONTRACT_REPOSITORY } from './repositories/player-contract.repository';
import { PlayerContractTypeOrmRepository } from './repositories/player-contract.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerContract])],
  providers: [
    {
      provide: PLAYER_CONTRACT_REPOSITORY,
      useClass: PlayerContractTypeOrmRepository,
    },
  ],
  exports: [PLAYER_CONTRACT_REPOSITORY],
})
export class PlayerContractsPersistenceModule {}
