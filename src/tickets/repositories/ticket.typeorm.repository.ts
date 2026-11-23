import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { Ticket } from '../entities/ticket.entity';
import { TicketRepository } from './ticket.repository';

@Injectable()
export class TicketTypeOrmRepository implements TicketRepository {
  constructor(
    @InjectRepository(Ticket) private readonly orm: Repository<Ticket>,
  ) {}

  findAll(): Promise<Ticket[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<Ticket | null> {
    return this.orm.findOne({ where: { id } });
  }

  countByMatchAndSeatingZone(
    matchId: number,
    seatingZoneId: number,
    excludeId?: number,
  ): Promise<number> {
    return this.orm.count({
      where: {
        matchId,
        seatingZoneId,
        ...(excludeId !== undefined ? { id: Not(excludeId) } : {}),
      },
    });
  }

  async save(entity: Ticket): Promise<Ticket> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: Ticket): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
