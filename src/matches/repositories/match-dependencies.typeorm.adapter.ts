import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet } from '../../bets/entities/bet.entity';
import {
  SCORING_EVENT_REPOSITORY,
  type ScoringEventRepository,
} from '../../scoring-events/repositories/scoring-event.repository';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { type MatchDependenciesChecker } from './match-dependencies.port';

// A match cannot be deleted while it has scoring events, tickets or bets.
@Injectable()
export class MatchDependenciesAdapter implements MatchDependenciesChecker {
  constructor(
    @Inject(SCORING_EVENT_REPOSITORY)
    private readonly scoringEventRepository: ScoringEventRepository,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
  ) {}

  async hasScoringEvents(matchId: number): Promise<boolean> {
    return this.scoringEventRepository.existsByMatchId(matchId);
  }

  async hasBlockingDependencies(matchId: number): Promise<boolean> {
    if (await this.hasScoringEvents(matchId)) return true;
    if (await this.ticketRepository.exists({ where: { matchId } })) return true;
    return this.betRepository.exists({ where: { matchId } });
  }
}
