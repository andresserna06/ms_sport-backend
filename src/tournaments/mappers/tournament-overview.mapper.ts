import { Injectable } from '@nestjs/common';
import {
  OverviewMatchDto,
  OverviewPhaseDto,
  TournamentOverviewDto,
} from '../dtos/tournament-overview.dto';
import { TournamentResponseDto } from '../dtos/tournament-response.dto';
import {
  OverviewMatchRow,
  OverviewPhaseRow,
  OverviewScoringEventRow,
} from '../repositories/tournament-overview.reader';

const PHASE_TYPES: Record<
  OverviewPhaseRow['phaseType'],
  'GROUP_STAGE' | 'KNOCKOUT'
> = {
  GROUP: 'GROUP_STAGE',
  FINAL: 'KNOCKOUT',
};

// Pure assembly of the overview: no data access, so it is tested without a
// database. The rows arrive already filtered to the selected tournament and
// ordered by the reader.
@Injectable()
export class TournamentOverviewMapper {
  toOverview(
    tournament: TournamentResponseDto,
    phases: OverviewPhaseRow[],
    matches: OverviewMatchRow[],
    scoringEvents: OverviewScoringEventRow[],
  ): TournamentOverviewDto {
    const matchesByPhase = this.groupBy(matches, (match) => match.phaseId);
    const eventsByMatch = this.groupBy(scoringEvents, (event) => event.matchId);

    const overview: TournamentOverviewDto = {
      tournament,
      phases: phases.map((phase) =>
        this.toPhase(phase, matchesByPhase.get(phase.id) ?? [], eventsByMatch),
      ),
    };

    if (phases.length === 0) {
      overview.message = 'El torneo aún no tiene fases configuradas';
    }
    return overview;
  }

  private groupBy<T>(rows: T[], key: (row: T) => number): Map<number, T[]> {
    const groups = new Map<number, T[]>();
    for (const row of rows) {
      const group = groups.get(key(row));
      if (group) group.push(row);
      else groups.set(key(row), [row]);
    }
    return groups;
  }

  private toPhase(
    phase: OverviewPhaseRow,
    matches: OverviewMatchRow[],
    eventsByMatch: Map<number, OverviewScoringEventRow[]>,
  ): OverviewPhaseDto {
    return {
      id: phase.id,
      name: phase.name,
      order: phase.order,
      type: PHASE_TYPES[phase.phaseType],
      matches: matches.map((match) =>
        this.toMatch(match, eventsByMatch.get(match.id) ?? []),
      ),
    };
  }

  private toMatch(
    match: OverviewMatchRow,
    scoringEvents: OverviewScoringEventRow[],
  ): OverviewMatchDto {
    return {
      id: match.id,
      scheduledAt: match.scheduledAt.toISOString(),
      status: match.status,
      hasResult: match.homeScore !== null && match.awayScore !== null,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      scoringEvents: scoringEvents.map((event) => ({
        id: event.id,
        minute: event.minute,
        type: event.type,
        player: event.player,
        team: event.team,
      })),
    };
  }
}
