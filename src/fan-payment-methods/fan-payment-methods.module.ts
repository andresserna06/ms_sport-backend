import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FansModule } from '../fans/fans.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { FanPaymentMethodsController } from './controllers/fan-payment-methods.controller';
import { FanPaymentMethod } from './entities/fan-payment-method.entity';
import { FanPaymentMethodMapper } from './mappers/fan-payment-method.mapper';
import { FAN_PAYMENT_METHODS_REPOSITORY } from './repositories/fan-payment-method.repository';
import { FanPaymentMethodTypeOrmRepository } from './repositories/fan-payment-method.typeorm.repository';
import { FanPaymentMethodsService } from './services/fan-payment-methods.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [
    TypeOrmModule.forFeature([FanPaymentMethod]),
    FansModule,
    PaymentMethodsModule,
  ],
  controllers: [FanPaymentMethodsController],
  providers: [
    FanPaymentMethodsService,
    FanPaymentMethodMapper,
    {
      provide: FAN_PAYMENT_METHODS_REPOSITORY,
      useClass: FanPaymentMethodTypeOrmRepository,
    },
  ],
  exports: [FanPaymentMethodsService],
})
export class FanPaymentMethodsModule {}
