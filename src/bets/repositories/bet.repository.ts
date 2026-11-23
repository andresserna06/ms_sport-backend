import { Bet } from '../entities/bet.entity';

export const BETS_REPOSITORY = Symbol('BETS_REPOSITORY');

export interface BetRepository {
  findAll(): Promise<Bet[]>;
  findById(id: number): Promise<Bet | null>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: Bet): Promise<Bet>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: Bet): Promise<void>;
}
