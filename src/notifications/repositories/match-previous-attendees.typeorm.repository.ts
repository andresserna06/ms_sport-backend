import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { MatchPreviousAttendeesRepository } from '../ports/match-previous-attendees.repository';

@Injectable()
export class MatchPreviousAttendeesTypeOrmRepository
  implements MatchPreviousAttendeesRepository
{
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async findActiveFanUserIdsByPreviousTeamMatches(
    currentMatchId: number,
    teamIds: number[],
  ): Promise<number[]> {
    const uniqueTeamIds = Array.from(
      new Set(teamIds.filter((teamId) => Number.isInteger(teamId) && teamId > 0)),
    );
    if (uniqueTeamIds.length === 0) {
      return [];
    }

    const rows = await this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.fan', 'fan')
      .innerJoin('ticket.match', 'match')
      .select('DISTINCT fan.user_id', 'userId')
      .where('fan.active = :active', { active: true })
      .andWhere('ticket.match_id <> :currentMatchId', { currentMatchId })
      .andWhere(
        '(match.home_team_id IN (:...teamIds) OR match.away_team_id IN (:...teamIds))',
        { teamIds: uniqueTeamIds },
      )
      .getRawMany<{ userId: number | string }>();

    return rows
      .map((row) => Number(row.userId))
      .filter((userId) => Number.isInteger(userId) && userId > 0);
  }
}
