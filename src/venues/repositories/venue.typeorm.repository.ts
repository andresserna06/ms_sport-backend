import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { Venue } from '../entities/venue.entity';
import { VenueRepository } from './venue.repository';

@Injectable()
export class VenueTypeOrmRepository implements VenueRepository {
  constructor(
    @InjectRepository(Venue) private readonly orm: Repository<Venue>,
  ) {}

  findAll(): Promise<Venue[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<Venue | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(entity: Venue): Promise<Venue> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: Venue): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
