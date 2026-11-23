import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodRepository } from './payment-method.repository';

@Injectable()
export class PaymentMethodTypeOrmRepository implements PaymentMethodRepository {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly orm: Repository<PaymentMethod>,
  ) {}

  findAll(): Promise<PaymentMethod[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<PaymentMethod | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(entity: PaymentMethod): Promise<PaymentMethod> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: PaymentMethod): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
