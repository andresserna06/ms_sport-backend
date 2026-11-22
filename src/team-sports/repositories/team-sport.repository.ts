import { TeamSport } from '../entities/team-sport.entity';

export const TEAM_SPORT_REPOSITORY = Symbol('TEAM_SPORT_REPOSITORY');

// Raised when the UNIQUE(team_id, sport_id) index rejects the pair (two
// concurrent requests for the same association).
export class DuplicateTeamSportError extends Error {
  constructor() {
    super('The team is already associated with the sport');
    this.name = 'DuplicateTeamSportError';
  }
}

// Raised when the team or the sport was deleted after it had been validated.
export class TeamSportTargetMissingError extends Error {
  constructor() {
    super('The team or the sport no longer exists');
    this.name = 'TeamSportTargetMissingError';
  }
}

export interface TeamSportRepository {
  findPair(teamId: number, sportId: number): Promise<TeamSport | null>;
  // Sports of a team, each one with the sport loaded; ordered by sport name.
  findByTeam(teamId: number, active?: boolean): Promise<TeamSport[]>;
  // Teams of a sport, each one with the team loaded; ordered by team name.
  findBySport(sportId: number, active?: boolean): Promise<TeamSport[]>;
  // Throws DuplicateTeamSportError or TeamSportTargetMissingError.
  create(teamId: number, sportId: number): Promise<TeamSport>;
  remove(association: TeamSport): Promise<void>;
}
