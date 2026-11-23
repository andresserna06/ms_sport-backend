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

  findAll(filters?: { tournamentId?: number; phaseId?: number }): Promise<Match[]> {
    const qb = this.repository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.phase', 'phase')
      .leftJoin('phase.tournament', 'tournament')
      .orderBy('match.scheduledAt', 'ASC');
    if (filters?.phaseId !== undefined) qb.andWhere('phase.id = :phaseId', { phaseId: filters.phaseId });
    if (filters?.tournamentId !== undefined) qb.andWhere('tournament.id = :tournamentId', { tournamentId: filters.tournamentId });
    return qb.getMany();
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
