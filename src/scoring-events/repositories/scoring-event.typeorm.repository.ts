import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoringEvent } from '../entities/scoring-event.entity';
import { ScoringEventRepository } from './scoring-event.repository';

@Injectable()
export class ScoringEventTypeOrmRepository implements ScoringEventRepository {
  constructor(
    @InjectRepository(ScoringEvent)
    private readonly orm: Repository<ScoringEvent>,
  ) {}

  async findById(id: number): Promise<ScoringEvent | null> {
    return this.orm.findOne({
      where: { id },
      relations: { player: true, team: true },
    });
  }

  async findByMatchId(matchId: number): Promise<ScoringEvent[]> {
    return this.orm.find({
      where: { matchId },
      relations: { player: true, team: true },
      order: { minute: 'ASC', id: 'ASC' },
    });
  }

  async existsByPlayerId(playerId: number): Promise<boolean> {
    return (await this.orm.count({ where: { playerId } })) > 0;
  }

  async existsByMatchId(matchId: number): Promise<boolean> {
    return (await this.orm.count({ where: { matchId } })) > 0;
  }

  async save(event: ScoringEvent): Promise<ScoringEvent> {
    const saved = await this.orm.save(event);
    const hydrated = await this.findById(saved.id);
    return hydrated ?? saved;
  }

  async remove(event: ScoringEvent): Promise<void> {
    await this.orm.remove(event);
  }
}
