import { Sport } from '../../sports/entities/sport.entity';
import { Team } from '../../teams/entities/team.entity';
import { TeamSport } from '../entities/team-sport.entity';
import { TeamSportMapper } from './team-sport.mapper';

describe('TeamSportMapper', () => {
  const mapper = new TeamSportMapper();
  const team = Object.assign(new Team(), {
    id: 1,
    name: 'Atlético',
    active: true,
  });
  const sport = Object.assign(new Sport(), {
    id: 2,
    name: 'Fútbol',
    active: false,
  });
  const association = Object.assign(new TeamSport(), {
    id: 9,
    teamId: 1,
    sportId: 2,
    team,
    sport,
  });

  it('maps the association with the names of both sides', () => {
    expect(mapper.toResponseDto(association, team, sport)).toEqual({
      id: 9,
      team: { id: 1, name: 'Atlético' },
      sport: { id: 2, name: 'Fútbol' },
    });
  });

  it('maps the sports of a team to summaries', () => {
    expect(mapper.toSportSummaries([association])).toEqual([
      { id: 2, name: 'Fútbol', active: false },
    ]);
  });

  it('maps the teams of a sport to summaries', () => {
    expect(mapper.toTeamSummaries([association])).toEqual([
      { id: 1, name: 'Atlético', active: true },
    ]);
  });
});
