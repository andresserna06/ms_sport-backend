import { Team } from '../entities/team.entity';

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');

export interface TeamCityReportRow {
  city: string;
  totalTeams: number;
}

// Raised by the repository when a foreign key still references the team, so
// the service never has to interpret database driver errors.
export class TeamInUseError extends Error {
  constructor() {
    super('Team is referenced by other records');
    this.name = 'TeamInUseError';
  }
}

export interface TeamAssociations {
  sports: number;
  contracts: number;
  matches: number;
  scoringEvents: number;
  registrations: number;
  fans: number;
}

// Raised when the UNIQUE(name) index rejects a team (two concurrent requests
// with the same name).
export class DuplicateTeamNameError extends Error {
  constructor() {
    super('A team with this name already exists');
    this.name = 'DuplicateTeamNameError';
  }
}

export interface TeamRepository {
  findById(id: number): Promise<Team | null>;
  findByName(name: string): Promise<Team | null>;
  findAll(active?: boolean): Promise<Team[]>;
  // Throws DuplicateTeamNameError when the UNIQUE(name) index is violated.
  save(team: Team): Promise<Team>;
  // Throws TeamInUseError when a foreign key still references the team.
  remove(team: Team): Promise<void>;
  countAssociations(teamId: number): Promise<TeamAssociations>;
  findActiveByCityReport(): Promise<TeamCityReportRow[]>;
}
