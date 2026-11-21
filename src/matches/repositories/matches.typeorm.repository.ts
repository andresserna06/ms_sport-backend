import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { MatchRepository } from './matches.repository';

@Injectable()
export class MatchTypeOrmRepository implements MatchRepository {
  constructor(
    @InjectRepository(Match)
    private readonly repository: Repository<Match>,
  ) {}

  findById(id: number): Promise<Match | null> {
    return this.repository.findOne({
      where: { id },
      relations: { phase: { tournament: true } },
    });
  }

  findAll(): Promise<Match[]> {
    return this.repository.find({
      relations: { phase: true },
      order: { scheduledAt: 'ASC' },
    });
  }

  findByPhase(phaseId: number): Promise<Match[]> {
    return this.repository.find({
      where: { phase: { id: phaseId } },
      relations: { phase: true },
      order: { scheduledAt: 'ASC' },
    });
  }

  save(match: Match): Promise<Match> {
    return this.repository.save(match);
  }

  async remove(match: Match): Promise<void> {
    await this.repository.remove(match);
  }
}
