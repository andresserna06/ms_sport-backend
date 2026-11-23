import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { FanPaymentMethod } from '../entities/fan-payment-method.entity';
import { FanPaymentMethodRepository } from './fan-payment-method.repository';

@Injectable()
export class FanPaymentMethodTypeOrmRepository implements FanPaymentMethodRepository {
  constructor(
    @InjectRepository(FanPaymentMethod)
    private readonly orm: Repository<FanPaymentMethod>,
  ) {}

  findAll(): Promise<FanPaymentMethod[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<FanPaymentMethod | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(entity: FanPaymentMethod): Promise<FanPaymentMethod> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: FanPaymentMethod): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
