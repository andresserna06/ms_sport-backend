import { TournamentResponseDto } from '../dtos/tournament-response.dto';
import {
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
});
