import { Ball } from '../entities/ball.entity';

export const BALLS_REPOSITORY = Symbol('BALLS_REPOSITORY');

export interface BallRepository {
  findAll(): Promise<Ball[]>;
  findById(id: number): Promise<Ball | null>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: Ball): Promise<Ball>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: Ball): Promise<void>;
}
