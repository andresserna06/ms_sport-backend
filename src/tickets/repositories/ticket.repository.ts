import { Ticket } from '../entities/ticket.entity';

export const TICKETS_REPOSITORY = Symbol('TICKETS_REPOSITORY');

export interface TicketRepository {
  findAll(): Promise<Ticket[]>;
  findById(id: number): Promise<Ticket | null>;
  countByMatchAndSeatingZone(
    matchId: number,
    seatingZoneId: number,
    excludeId?: number,
  ): Promise<number>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: Ticket): Promise<Ticket>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: Ticket): Promise<void>;
}
