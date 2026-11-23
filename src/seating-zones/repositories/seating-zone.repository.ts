import { SeatingZone } from '../entities/seating-zone.entity';

export const SEATING_ZONES_REPOSITORY = Symbol('SEATING_ZONES_REPOSITORY');

export interface SeatingZoneRepository {
  findAll(): Promise<SeatingZone[]>;
  findById(id: number): Promise<SeatingZone | null>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: SeatingZone): Promise<SeatingZone>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: SeatingZone): Promise<void>;
}
