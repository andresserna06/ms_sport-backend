import { SpatialPosition } from '../entities/spatial-position.entity';

export const SPATIAL_POSITIONS_REPOSITORY = Symbol(
  'SPATIAL_POSITIONS_REPOSITORY',
);

export interface SpatialPositionRepository {
  findAll(): Promise<SpatialPosition[]>;
  findById(id: number): Promise<SpatialPosition | null>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: SpatialPosition): Promise<SpatialPosition>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: SpatialPosition): Promise<void>;
}
