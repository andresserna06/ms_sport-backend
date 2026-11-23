import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { Fan } from '../entities/fan.entity';
import { FanRepository } from './fan.repository';

@Injectable()
export class FanTypeOrmRepository implements FanRepository {
  constructor(@InjectRepository(Fan) private readonly orm: Repository<Fan>) {}

  findAll(): Promise<Fan[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<Fan | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(entity: Fan): Promise<Fan> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: Fan): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
