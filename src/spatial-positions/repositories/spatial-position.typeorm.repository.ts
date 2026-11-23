import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { SpatialPosition } from '../entities/spatial-position.entity';
import { SpatialPositionRepository } from './spatial-position.repository';

@Injectable()
export class SpatialPositionTypeOrmRepository implements SpatialPositionRepository {
  constructor(
    @InjectRepository(SpatialPosition)
    private readonly orm: Repository<SpatialPosition>,
  ) {}

  findAll(): Promise<SpatialPosition[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<SpatialPosition | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(entity: SpatialPosition): Promise<SpatialPosition> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: SpatialPosition): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
