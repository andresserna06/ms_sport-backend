import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethodsController } from './controllers/payment-methods.controller';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentMethodMapper } from './mappers/payment-method.mapper';
import { PAYMENT_METHODS_REPOSITORY } from './repositories/payment-method.repository';
import { PaymentMethodTypeOrmRepository } from './repositories/payment-method.typeorm.repository';
import { PaymentMethodsService } from './services/payment-methods.service';

// Basic CRUD created from the class diagram. The business rules of this entity
// are added by whoever needs it.
@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod])],
  controllers: [PaymentMethodsController],
  providers: [
    PaymentMethodsService,
    PaymentMethodMapper,
    {
      provide: PAYMENT_METHODS_REPOSITORY,
      useClass: PaymentMethodTypeOrmRepository,
    },
  ],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
