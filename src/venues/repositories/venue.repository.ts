import { Venue } from '../entities/venue.entity';

export const VENUES_REPOSITORY = Symbol('VENUES_REPOSITORY');

export interface VenueRepository {
  findAll(): Promise<Venue[]>;
  findById(id: number): Promise<Venue | null>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: Venue): Promise<Venue>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: Venue): Promise<void>;
}
