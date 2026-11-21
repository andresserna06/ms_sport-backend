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

export interface TeamRepository {
  findById(id: number): Promise<Team | null>;
  findByName(name: string): Promise<Team | null>;
  findAll(active?: boolean): Promise<Team[]>;
  save(team: Team): Promise<Team>;
  // Throws TeamInUseError when a foreign key still references the team.
  remove(team: Team): Promise<void>;
  countAssociations(teamId: number): Promise<number>;
  findActiveByCityReport(): Promise<TeamCityReportRow[]>;
}
