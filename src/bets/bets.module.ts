import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FansModule } from '../fans/fans.module';
import { FanPaymentMethodsModule } from '../fan-payment-methods/fan-payment-methods.module';
import { BetsController } from './controllers/bets.controller';
import { Bet } from './entities/bet.entity';
import { BetMapper } from './mappers/bet.mapper';
import { BETS_REPOSITORY } from './repositories/bet.repository';
import { BetTypeOrmRepository } from './repositories/bet.typeorm.repository';
import { BetsService } from './services/bets.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [
    TypeOrmModule.forFeature([Bet]),
    FanPaymentMethodsModule,
    FansModule,
  ],
  controllers: [BetsController],
  providers: [
    BetsService,
    BetMapper,
    { provide: BETS_REPOSITORY, useClass: BetTypeOrmRepository },
  ],
  exports: [BetsService],
})
export class BetsModule {}
