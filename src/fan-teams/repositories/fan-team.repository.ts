import { FanTeam } from '../entities/fan-team.entity';

export const FAN_TEAMS_REPOSITORY = Symbol('FAN_TEAMS_REPOSITORY');

export interface FanTeamRepository {
  findAll(): Promise<FanTeam[]>;
  findById(id: number): Promise<FanTeam | null>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: FanTeam): Promise<FanTeam>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: FanTeam): Promise<void>;
}
