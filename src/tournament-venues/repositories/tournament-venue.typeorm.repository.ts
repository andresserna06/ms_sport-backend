import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { translateDatabaseError } from '../../common/persistence/database-errors';
import { TournamentVenue } from '../entities/tournament-venue.entity';
import { TournamentVenueRepository } from './tournament-venue.repository';

@Injectable()
export class TournamentVenueTypeOrmRepository implements TournamentVenueRepository {
  constructor(
    @InjectRepository(TournamentVenue)
    private readonly orm: Repository<TournamentVenue>,
  ) {}

  findAll(): Promise<TournamentVenue[]> {
    return this.orm.find({ order: { id: 'ASC' } });
  }

  findById(id: number): Promise<TournamentVenue | null> {
    return this.orm.findOne({ where: { id } });
  }

  existsByTournamentAndVenue(
    tournamentId: number,
    venueId: number,
  ): Promise<boolean> {
    return this.orm.exists({ where: { tournamentId, venueId } });
  }

  async save(entity: TournamentVenue): Promise<TournamentVenue> {
    try {
      return await this.orm.save(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async remove(entity: TournamentVenue): Promise<void> {
    try {
      await this.orm.remove(entity);
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }
}
