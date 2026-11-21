import { Sport } from '../entities/sport.entity';

export const SPORT_REPOSITORY = Symbol('SPORT_REPOSITORY');

export interface SportDependencies {
  subSports: number;
  activeSubSports: number;
  teams: number;
  tournaments: number;
}

export interface SportFilter {
  active?: boolean;
  name?: string;
  parentSportId?: number;
}

// Domain errors raised by the repository so the service never has to
// interpret database driver errors.
export class DuplicateSportNameError extends Error {
  constructor() {
    super('Sport name already exists');
    this.name = 'DuplicateSportNameError';
  }
}

export class SportInUseError extends Error {
  constructor() {
    super('Sport is referenced by other records');
    this.name = 'SportInUseError';
  }
}

export class ParentSportNotFoundError extends Error {
  constructor() {
    super('Parent sport no longer exists');
    this.name = 'ParentSportNotFoundError';
  }
}

export interface SportRepository {
  // Plain entity (no relations loaded): use it before modifying and saving.
  findById(id: number): Promise<Sport | null>;
  // Read models: include `parentSport` and `subSportsCount`.
  findDetail(id: number): Promise<Sport | null>;
  findAll(filter: SportFilter): Promise<Sport[]>;
  findSubSports(parentSportId: number, active?: boolean): Promise<Sport[]>;
  existsByName(name: string, excludeId?: number): Promise<boolean>;
  countDependencies(id: number): Promise<SportDependencies>;
  // Throws DuplicateSportNameError when the UNIQUE(name) index is violated and
  // ParentSportNotFoundError when the parent was deleted in the meantime.
  save(sport: Sport): Promise<Sport>;
  // Throws SportInUseError when a foreign key still references the sport.
  remove(sport: Sport): Promise<void>;
}
