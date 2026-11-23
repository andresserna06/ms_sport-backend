import { Tournament } from '../entities/tournament.entity';

export const TOURNAMENT_REPOSITORY = Symbol('TOURNAMENT_REPOSITORY');

export interface TournamentFilter {
  active?: boolean;
  sportId?: number;
  name?: string;
}

// What still ties a tournament to other records and blocks its deletion.
// Registrations (HU-GC-02) add their own count when that story creates them.
export interface TournamentDependencies {
  phases: number;
  matches: number;
  registrations: number;
  venues: number;
}

// Raised when the UNIQUE(sport_id, name) index rejects a tournament (two
// concurrent requests with the same name in the same sport).
export class DuplicateTournamentNameError extends Error {
  constructor() {
    super('A tournament with this name already exists in the sport');
    this.name = 'DuplicateTournamentNameError';
  }
}

// Raised when the sport was deleted after it had been validated.
export class TournamentSportMissingError extends Error {
  constructor() {
    super('The sport no longer exists');
    this.name = 'TournamentSportMissingError';
  }
}

// Raised by the repository when a foreign key still references the tournament.
export class TournamentInUseError extends Error {
  constructor() {
    super('Tournament is referenced by other records');
    this.name = 'TournamentInUseError';
  }
}

export interface TournamentRepository {
  // Plain entity, no relations: it is modified and saved afterwards.
  findById(id: number): Promise<Tournament | null>;
  // Tournament with its sport loaded, for responses.
  findDetail(id: number): Promise<Tournament | null>;
  findAll(filter: TournamentFilter): Promise<Tournament[]>;
  // Active tournaments whose enrollment is still open and that have not started.
  findOpenEnrollment(): Promise<Tournament[]>;
  existsByName(
    sportId: number,
    name: string,
    ignoreId?: number,
  ): Promise<boolean>;
  countDependencies(id: number): Promise<TournamentDependencies>;
  // Throws DuplicateTournamentNameError or TournamentSportMissingError.
  save(tournament: Tournament): Promise<Tournament>;
  // Throws TournamentInUseError when a foreign key still references it.
  remove(tournament: Tournament): Promise<void>;
}
