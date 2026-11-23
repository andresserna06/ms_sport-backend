import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { Bet } from '../entities/bet.entity';
import { BetRepository } from './bet.repository';

@Injectable()
export class BetTypeOrmRepository implements BetRepository {
  constructor(@InjectRepository(Bet) private readonly orm: Repository<Bet>) {}

  findAll(): Promise<Bet[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<Bet | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(entity: Bet): Promise<Bet> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: Bet): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
