import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { FanTeam } from '../entities/fan-team.entity';
import { FanTeamRepository } from './fan-team.repository';

@Injectable()
export class FanTeamTypeOrmRepository implements FanTeamRepository {
  constructor(
    @InjectRepository(FanTeam) private readonly orm: Repository<FanTeam>,
  ) {}

  findAll(): Promise<FanTeam[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<FanTeam | null> {
    return this.orm.findOne({ where: { id } });
  }

  async save(entity: FanTeam): Promise<FanTeam> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: FanTeam): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
