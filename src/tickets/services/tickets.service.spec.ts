import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import {
  DuplicateRecordError,
  MissingReferenceError,
  RecordInUseError,
} from '../../common/persistence/database-errors';
import { FansService } from '../../fans/services/fans.service';
import { MatchesService } from '../../matches/matches.service';
import { SeatingZonesService } from '../../seating-zones/services/seating-zones.service';
import { Ticket } from '../entities/ticket.entity';
import { TicketMapper } from '../mappers/ticket.mapper';
import type { TicketRepository } from '../repositories/ticket.repository';
import { TicketsService } from './tickets.service';

const dto = { fanId: 1, matchId: 1, seatingZoneId: 1, price: 10.5 };

describe('TicketsService', () => {
  let repository: jest.Mocked<TicketRepository>;
  let service: TicketsService;
  let fansService: { findOne: jest.Mock };
  let matchesService: { findOne: jest.Mock };
  let seatingZonesService: { findOne: jest.Mock };

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      countByMatchAndSeatingZone: jest.fn().mockResolvedValue(0),
      save: jest.fn(async (entity: Ticket) =>
        Object.assign(entity, {
          id: entity.id ?? 1,
          purchasedAt: new Date('2027-01-01T10:00:00.000Z'),
        }),
      ),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    fansService = { findOne: jest.fn().mockResolvedValue({ id: 1, active: true }) };
    matchesService = { findOne: jest.fn().mockResolvedValue({ id: 1, venueId: 7 }) };
    seatingZonesService = {
      findOne: jest.fn().mockResolvedValue({ id: 1, venueId: 7, capacity: 2 }),
    };
    service = new TicketsService(
      repository,
      new TicketMapper(),
      fansService as unknown as FansService,
      matchesService as unknown as MatchesService,
      seatingZonesService as unknown as SeatingZonesService,
    );
  });

  describe('issuing rules (proposal)', () => {
    it('answers 409 when the zone belongs to another venue', async () => {
      seatingZonesService.findOne.mockResolvedValue({ id: 1, venueId: 8, capacity: 2 });

      await expect(service.create(dto)).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_STATE });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('answers 409 when the match has no venue', async () => {
      matchesService.findOne.mockResolvedValue({ id: 1, venueId: null });

      await expect(service.create(dto)).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_STATE });
    });

    it('answers 409 when the zone has no capacity left', async () => {
      repository.countByMatchAndSeatingZone.mockResolvedValue(2);

      await expect(service.create(dto)).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_STATE });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not limit tickets when the zone has no capacity set', async () => {
      seatingZonesService.findOne.mockResolvedValue({ id: 1, venueId: 7, capacity: null });

      await expect(service.create(dto)).resolves.toMatchObject({ id: 1 });
      expect(repository.countByMatchAndSeatingZone).not.toHaveBeenCalled();
    });

    it('answers 409 when the fan is inactive', async () => {
      fansService.findOne.mockResolvedValue({ id: 1, active: false });

      await expect(service.create(dto)).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_STATE });
    });

    it('excludes the ticket itself from the capacity count on update', async () => {
      repository.findById.mockResolvedValue(existing());

      await service.update(4, dto);

      expect(repository.countByMatchAndSeatingZone).toHaveBeenCalledWith(1, 1, 4);
    });
  });

  const existing = () =>
    Object.assign(new TicketMapper().toEntity(dto), {
      id: 4,
      purchasedAt: new Date('2027-01-01T10:00:00.000Z'),
    });

  it('creates a record', async () => {
    await expect(service.create(dto)).resolves.toMatchObject({ id: 1 });
    expect(repository.save).toHaveBeenCalled();
  });

  it('answers 409 when a unique value is repeated', async () => {
    repository.save.mockRejectedValue(new DuplicateRecordError());

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.ALREADY_EXISTS,
    });
  });

  it('answers 404 naming the missing reference', async () => {
    repository.save.mockRejectedValue(
      new MissingReferenceError('FK_tickets_fan'),
    );

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
      message: 'No existe el aficionado',
    });
  });

  it('lists the records', async () => {
    repository.findAll.mockResolvedValue([existing()]);

    await expect(service.findAll()).resolves.toHaveLength(1);
  });

  it('answers 404 for an unknown id', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(9)).rejects.toBeInstanceOf(
      ApplicationException,
    );
    await expect(service.findOne(9)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
      message: 'No existe el boleto con id 9',
    });
  });

  it('updates a record', async () => {
    repository.findById.mockResolvedValue(existing());

    await expect(service.update(4, dto)).resolves.toMatchObject({ id: 4 });
  });

  it('removes a record', async () => {
    repository.findById.mockResolvedValue(existing());

    await expect(service.remove(4)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalled();
  });

  it('answers 409 when the record is still referenced', async () => {
    repository.findById.mockResolvedValue(existing());
    repository.remove.mockRejectedValue(new RecordInUseError());

    await expect(service.remove(4)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
  });

  it('rethrows unexpected errors', async () => {
    repository.findById.mockResolvedValue(existing());
    repository.remove.mockRejectedValue(new Error('boom'));

    await expect(service.remove(4)).rejects.toThrow('boom');
  });
});
