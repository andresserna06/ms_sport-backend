import { Fan } from '../entities/fan.entity';

export const FANS_REPOSITORY = Symbol('FANS_REPOSITORY');

export interface FanRepository {
  findAll(): Promise<Fan[]>;
  findById(id: number): Promise<Fan | null>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: Fan): Promise<Fan>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: Fan): Promise<void>;
}
