import { TournamentResponseDto } from '../dtos/tournament-response.dto';
import {
  OverviewGroupTeamRow,
  OverviewMatchRow,
  OverviewPhaseRow,
  OverviewScoringEventRow,
} from '../repositories/tournament-overview.reader';
import { TournamentOverviewMapper } from './tournament-overview.mapper';

const tournament: TournamentResponseDto = {
  id: 1,
  name: 'Copa',
  sport: { id: 5, name: 'Fútbol' },
  startDate: '2027-03-01',
  enrollmentDeadline: '2027-02-01',
  active: true,
};

const groupPhase: OverviewPhaseRow = {
  id: 10,
  name: 'Fase de grupos',
  order: 1,
  phaseType: 'GROUP',
};
const finalPhase: OverviewPhaseRow = {
  id: 11,
  name: 'Final',
  order: 2,
  phaseType: 'FINAL',
};

const match = (
  overrides: Partial<OverviewMatchRow> = {},
): OverviewMatchRow => ({
  id: 77,
  phaseId: 10,
  scheduledAt: new Date('2027-03-01T15:00:00.000Z'),
  status: 'FINISHED',
  homeScore: 2,
  awayScore: 1,
  homeTeam: { id: 1, name: 'Atlético' },
  awayTeam: { id: 2, name: 'Millonarios' },
  ...overrides,
});

const goal = (
  overrides: Partial<OverviewScoringEventRow> = {},
): OverviewScoringEventRow => ({
  id: 1,
  matchId: 77,
  minute: 12,
  type: 'GOAL',
  player: { id: 9, document: '1001' },
  team: { id: 1, name: 'Atlético' },
  ...overrides,
});

describe('TournamentOverviewMapper', () => {
  const mapper = new TournamentOverviewMapper();

  it('answers with an empty list and a message when there are no phases', () => {
    expect(mapper.toOverview(tournament, [], [], [])).toEqual({
      tournament,
      message: 'El torneo aún no tiene fases configuradas',
      phases: [],
    });
  });

  it('does not add the message when there are phases', () => {
    const overview = mapper.toOverview(tournament, [groupPhase], [], []);

    expect(overview).not.toHaveProperty('message');
    expect(overview.phases[0].matches).toEqual([]);
  });

  it('maps the phase types of the model to the ones of the API', () => {
    const overview = mapper.toOverview(
      tournament,
      [groupPhase, finalPhase],
      [],
      [],
    );

    expect(overview.phases.map((phase) => phase.type)).toEqual([
      'GROUP_STAGE',
      'KNOCKOUT',
    ]);
    expect(overview.phases.map((phase) => phase.order)).toEqual([1, 2]);
  });

  it('puts each match in its own phase', () => {
    const overview = mapper.toOverview(
      tournament,
      [groupPhase, finalPhase],
      [
        match({ id: 1, phaseId: 10 }),
        match({ id: 2, phaseId: 11 }),
        match({ id: 3, phaseId: 10 }),
      ],
      [],
    );

    expect(overview.phases[0].matches.map((m) => m.id)).toEqual([1, 3]);
    expect(overview.phases[1].matches.map((m) => m.id)).toEqual([2]);
  });

  it('tells matches with a registered result from pending ones', () => {
    const overview = mapper.toOverview(
      tournament,
      [groupPhase],
      [
        match({ id: 1 }),
        match({ id: 2, status: 'SCHEDULED', homeScore: null, awayScore: null }),
        match({ id: 3, status: 'IN_PROGRESS', homeScore: 1, awayScore: null }),
      ],
      [],
    );

    expect(overview.phases[0].matches.map((m) => m.hasResult)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('treats a 0-0 score as a registered result', () => {
    const overview = mapper.toOverview(
      tournament,
      [groupPhase],
      [match({ homeScore: 0, awayScore: 0 })],
      [],
    );

    expect(overview.phases[0].matches[0].hasResult).toBe(true);
  });

  it('keeps a match without teams instead of failing', () => {
    const overview = mapper.toOverview(
      tournament,
      [groupPhase],
      [match({ homeTeam: null, awayTeam: null })],
      [],
    );

    expect(overview.phases[0].matches[0]).toMatchObject({
      homeTeam: null,
      awayTeam: null,
    });
  });

  it('attaches the scoring events to their match and serializes the date', () => {
    const overview = mapper.toOverview(
      tournament,
      [groupPhase],
      [match({ id: 77 }), match({ id: 78 })],
      [
        goal({ id: 1, matchId: 77 }),
        goal({ id: 2, matchId: 77, minute: 40 }),
        goal({ id: 3, matchId: 78 }),
      ],
    );

    const [first, second] = overview.phases[0].matches;
    expect(first.scoringEvents.map((e) => e.id)).toEqual([1, 2]);
    expect(second.scoringEvents.map((e) => e.id)).toEqual([3]);
    expect(first.scoringEvents[0]).toEqual({
      id: 1,
      minute: 12,
      type: 'GOAL',
      player: { id: 9, document: '1001' },
      team: { id: 1, name: 'Atlético' },
    });
    expect(first.scheduledAt).toBe('2027-03-01T15:00:00.000Z');
  });

  it('gives every match an empty events list when there are none', () => {
    const overview = mapper.toOverview(tournament, [groupPhase], [match()], []);

    expect(overview.phases[0].matches[0].scoringEvents).toEqual([]);
  });

  describe('standings of a group phase (proposal)', () => {
    const teams: OverviewGroupTeamRow[] = [
      { groupId: 10, id: 1, name: 'Atlético' },
      { groupId: 10, id: 2, name: 'Millonarios' },
      { groupId: 10, id: 3, name: 'Nacional' },
      { groupId: 99, id: 4, name: 'Of another group' },
    ];
    const team = (id: number) => {
      const row = teams.find((t) => t.id === id)!;
      return { id: row.id, name: row.name };
    };

    it('lists only the teams of the group', () => {
      const [phase] = mapper.toOverview(tournament, [groupPhase], [], [], teams).phases;

      expect(phase.teams).toEqual([team(1), team(2), team(3)]);
      expect(phase.bracket).toBeUndefined();
    });

    it('counts 3 points per win, 1 per draw and only FINISHED matches', () => {
      const matches = [
        match({ id: 1, homeTeam: team(1), awayTeam: team(2), homeScore: 2, awayScore: 0 }),
        match({ id: 2, homeTeam: team(2), awayTeam: team(3), homeScore: 1, awayScore: 1 }),
        match({ id: 3, homeTeam: team(3), awayTeam: team(1), homeScore: 5, awayScore: 0, status: 'IN_PROGRESS' }),
        match({ id: 4, homeTeam: team(3), awayTeam: team(1), homeScore: null, awayScore: null, status: 'SCHEDULED' }),
      ];

      const [phase] = mapper.toOverview(tournament, [groupPhase], matches, [], teams).phases;

      expect(phase.standings).toEqual([
        { position: 1, team: team(1), played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, points: 3 },
        { position: 2, team: team(3), played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, goalDifference: 0, points: 1 },
        { position: 3, team: team(2), played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 1 },
      ]);
    });

    it('breaks ties by goal difference, then goals for, then name', () => {
      const matches = [
        // 1 and 2 draw 2-2; 3 beats nobody: everyone ends with 1 point except 3.
        match({ id: 1, homeTeam: team(2), awayTeam: team(1), homeScore: 2, awayScore: 2 }),
      ];

      const [phase] = mapper.toOverview(tournament, [groupPhase], matches, [], teams).phases;

      expect(phase.standings!.map((row) => row.team.name)).toEqual([
        'Atlético',
        'Millonarios',
        'Nacional',
      ]);
    });

    it('shows every team with zeros when no match is finished', () => {
      const [phase] = mapper.toOverview(tournament, [groupPhase], [], [], teams).phases;

      expect(phase.standings!.every((row) => row.played === 0 && row.points === 0)).toBe(true);
      expect(phase.standings!.map((row) => row.position)).toEqual([1, 2, 3]);
    });
  });

  describe('bracket of a knockout phase', () => {
    const final = (overrides: Partial<OverviewMatchRow>) => match({ phaseId: 11, ...overrides });

    it('shows the winner of a finished match', () => {
      const [phase] = mapper.toOverview(tournament, [finalPhase], [final({ id: 90 })], []).phases;

      expect(phase.standings).toBeUndefined();
      expect(phase.bracket).toEqual([
        {
          matchId: 90,
          status: 'FINISHED',
          homeTeam: { id: 1, name: 'Atlético' },
          awayTeam: { id: 2, name: 'Millonarios' },
          homeScore: 2,
          awayScore: 1,
          winner: { id: 1, name: 'Atlético' },
        },
      ]);
    });

    it('has no winner while the match is not finished or is drawn', () => {
      const matches = [
        final({ id: 90, status: 'SCHEDULED', homeScore: null, awayScore: null }),
        final({ id: 91, homeScore: 1, awayScore: 1 }),
      ];

      const [phase] = mapper.toOverview(tournament, [finalPhase], matches, []).phases;

      expect(phase.bracket!.map((crossing) => crossing.winner)).toEqual([null, null]);
    });
  });
});
