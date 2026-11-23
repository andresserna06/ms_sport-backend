import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { SeatingZone } from '../entities/seating-zone.entity';
import { SeatingZoneRepository } from './seating-zone.repository';

@Injectable()
export class SeatingZoneTypeOrmRepository implements SeatingZoneRepository {
  constructor(
    @InjectRepository(SeatingZone)
    private readonly orm: Repository<SeatingZone>,
  ) {}

  findAll(): Promise<SeatingZone[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<SeatingZone | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(entity: SeatingZone): Promise<SeatingZone> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: SeatingZone): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
