import { Injectable } from '@nestjs/common';
import {
  OverviewBracketMatchDto,
  OverviewMatchDto,
  OverviewPhaseDto,
  OverviewStandingDto,
  OverviewTeamDto,
  TournamentOverviewDto,
} from '../dtos/tournament-overview.dto';
import { TournamentResponseDto } from '../dtos/tournament-response.dto';
import {
  OverviewGroupTeamRow,
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
    groupTeams: OverviewGroupTeamRow[] = [],
  ): TournamentOverviewDto {
    const matchesByPhase = this.groupBy(matches, (match) => match.phaseId);
    const eventsByMatch = this.groupBy(scoringEvents, (event) => event.matchId);
    const teamsByGroup = this.groupBy(groupTeams, (team) => team.groupId);

    const overview: TournamentOverviewDto = {
      tournament,
      phases: phases.map((phase) =>
        this.toPhase(
          phase,
          matchesByPhase.get(phase.id) ?? [],
          eventsByMatch,
          teamsByGroup.get(phase.id) ?? [],
        ),
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
    groupTeams: OverviewGroupTeamRow[],
  ): OverviewPhaseDto {
    const dto: OverviewPhaseDto = {
      id: phase.id,
      name: phase.name,
      order: phase.order,
      type: PHASE_TYPES[phase.phaseType],
    } as OverviewPhaseDto;

    if (phase.phaseType === 'GROUP') {
      const teams = groupTeams.map(({ id, name }) => ({ id, name }));
      dto.teams = teams;
      dto.standings = this.toStandings(teams, matches);
    } else {
      dto.bracket = matches.map((match) => this.toBracketMatch(match));
    }

    dto.matches = matches.map((match) =>
      this.toMatch(match, eventsByMatch.get(match.id) ?? []),
    );
    return dto;
  }

  // (Propuesta, reglas-dominio) Only FINISHED matches with both scores count;
  // win 3, draw 1, loss 0; order by points, goal difference, goals for, name.
  // Calculated on every query, never stored.
  private toStandings(
    teams: OverviewTeamDto[],
    matches: OverviewMatchRow[],
  ): OverviewStandingDto[] {
    const rows = new Map<number, OverviewStandingDto>(
      teams.map((team) => [
        team.id,
        {
          position: 0,
          team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        },
      ]),
    );

    for (const match of matches) {
      if (!this.countsForStandings(match)) continue;
      const home = rows.get(match.homeTeam!.id);
      const away = rows.get(match.awayTeam!.id);
      // A team that is not in the group (wrong data) is ignored.
      if (home) this.addResult(home, match.homeScore!, match.awayScore!);
      if (away) this.addResult(away, match.awayScore!, match.homeScore!);
    }

    return [...rows.values()]
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          a.team.name.localeCompare(b.team.name, 'es'),
      )
      .map((row, index) => ({ ...row, position: index + 1 }));
  }

  private countsForStandings(match: OverviewMatchRow): boolean {
    return (
      match.status === 'FINISHED' &&
      match.homeTeam !== null &&
      match.awayTeam !== null &&
      match.homeScore !== null &&
      match.awayScore !== null
    );
  }

  private addResult(row: OverviewStandingDto, scored: number, conceded: number): void {
    row.played += 1;
    row.goalsFor += scored;
    row.goalsAgainst += conceded;
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    if (scored > conceded) {
      row.won += 1;
      row.points += 3;
    } else if (scored === conceded) {
      row.drawn += 1;
      row.points += 1;
    } else {
      row.lost += 1;
    }
  }

  private toBracketMatch(match: OverviewMatchRow): OverviewBracketMatchDto {
    return {
      matchId: match.id,
      status: match.status,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      winner: this.winnerOf(match),
    };
  }

  // [PENDIENTE] tie rule in knockout phases: a drawn match has no winner yet.
  private winnerOf(match: OverviewMatchRow): OverviewTeamDto | null {
    if (!this.countsForStandings(match)) return null;
    if (match.homeScore! > match.awayScore!) return match.homeTeam;
    if (match.awayScore! > match.homeScore!) return match.awayTeam;
    return null;
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
