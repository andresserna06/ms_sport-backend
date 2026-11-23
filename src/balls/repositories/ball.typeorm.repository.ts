import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { Ball } from '../entities/ball.entity';
import { BallRepository } from './ball.repository';

@Injectable()
export class BallTypeOrmRepository implements BallRepository {
  constructor(@InjectRepository(Ball) private readonly orm: Repository<Ball>) {}

  findAll(): Promise<Ball[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<Ball | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(entity: Ball): Promise<Ball> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: Ball): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
