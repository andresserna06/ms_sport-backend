import { Module } from '@nestjs/common';
import { PlayersModule } from '../players/players.module';
import { TeamsModule } from '../teams/teams.module';
import { PlayerContractController } from './controllers/player-contract.controller';
import { PlayerContractMapper } from './mappers/player-contract.mapper';
import { PlayerContractsPersistenceModule } from './player-contracts-persistence.module';
import { PlayerContractService } from './services/player-contract.service';

@Module({
  imports: [PlayerContractsPersistenceModule, PlayersModule, TeamsModule],
  controllers: [PlayerContractController],
  providers: [PlayerContractService, PlayerContractMapper],
  exports: [PlayerContractService],
})
export class PlayerContractsModule {}
