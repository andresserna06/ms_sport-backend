import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { Phase } from '../../phases/base/entities/phase.entity';
import { ScoringEvent } from '../../scoring-events/entities/scoring-event.entity';
import { Team } from '../../teams/entities/team.entity';
import {
  OverviewGroupTeamRow,
  OverviewMatchRow,
  OverviewPhaseRow,
  OverviewScoringEventRow,
  TournamentOverviewReader,
} from './tournament-overview.reader';

@Injectable()
export class TournamentOverviewTypeOrmReader implements TournamentOverviewReader {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findPhases(tournamentId: number): Promise<OverviewPhaseRow[]> {
    const phases = await this.dataSource.manager.find(Phase, {
      where: { tournamentId },
      order: { order: 'ASC', id: 'ASC' },
    });
    return phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      order: phase.order,
      phaseType: phase.phaseType,
    }));
  }

  async findMatches(phaseIds: number[]): Promise<OverviewMatchRow[]> {
    if (phaseIds.length === 0) return [];

    const matches = await this.dataSource.manager
      .createQueryBuilder(Match, 'match')
      .innerJoinAndSelect('match.phase', 'phase')
      .leftJoinAndSelect('match.homeTeam', 'homeTeam')
      .leftJoinAndSelect('match.awayTeam', 'awayTeam')
      .where('phase.id IN (:...phaseIds)', { phaseIds })
      .orderBy('match.scheduledAt', 'ASC')
      .addOrderBy('match.id', 'ASC')
      .getMany();

    return matches.map((match) => ({
      id: match.id,
      phaseId: match.phase.id,
      scheduledAt: match.scheduledAt,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      homeTeam: match.homeTeam
        ? { id: match.homeTeam.id, name: match.homeTeam.name }
        : null,
      awayTeam: match.awayTeam
        ? { id: match.awayTeam.id, name: match.awayTeam.name }
        : null,
    }));
  }

  async findScoringEvents(
    matchIds: number[],
  ): Promise<OverviewScoringEventRow[]> {
    if (matchIds.length === 0) return [];

    const events = await this.dataSource.manager
      .createQueryBuilder(ScoringEvent, 'event')
      .innerJoinAndSelect('event.player', 'player')
      .innerJoinAndSelect('event.team', 'team')
      .where('event.matchId IN (:...matchIds)', { matchIds })
      .orderBy('event.minute', 'ASC')
      .addOrderBy('event.id', 'ASC')
      .getMany();

    return events.map((event) => ({
      id: event.id,
      matchId: event.matchId,
      minute: event.minute,
      type: event.type,
      player: { id: event.player.id, document: event.player.document },
      team: { id: event.team.id, name: event.team.name },
    }));
  }

  async findGroupTeams(groupIds: number[]): Promise<OverviewGroupTeamRow[]> {
    if (groupIds.length === 0) return [];

    const teams = await this.dataSource.manager
      .createQueryBuilder(Team, 'team')
      .innerJoinAndSelect('team.group', 'group')
      .where('group.id IN (:...groupIds)', { groupIds })
      .orderBy('team.name', 'ASC')
      .addOrderBy('team.id', 'ASC')
      .getMany();

    return teams.map((team) => ({
      groupId: team.group!.id,
      id: team.id,
      name: team.name,
    }));
  }
}
