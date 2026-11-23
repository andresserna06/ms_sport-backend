import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import {
  DuplicateRecordError,
  MissingReferenceError,
  RecordInUseError,
} from '../../common/persistence/database-errors';
import { TournamentVenue } from '../entities/tournament-venue.entity';
import { TournamentVenueMapper } from '../mappers/tournament-venue.mapper';
import type { TournamentVenueRepository } from '../repositories/tournament-venue.repository';
import { TournamentVenuesService } from './tournament-venues.service';

const dto = { tournamentId: 1, venueId: 1 };

describe('TournamentVenuesService', () => {
  let repository: jest.Mocked<TournamentVenueRepository>;
  let service: TournamentVenuesService;

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      existsByTournamentAndVenue: jest.fn().mockResolvedValue(true),
      save: jest.fn(async (entity: TournamentVenue) =>
        Object.assign(entity, { id: entity.id ?? 1 }),
      ),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    service = new TournamentVenuesService(
      repository,
      new TournamentVenueMapper(),
    );
  });

  const existing = () =>
    Object.assign(new TournamentVenueMapper().toEntity(dto), { id: 4 });

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
      new MissingReferenceError('FK_tournament_venues_tournament'),
    );

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
      message: 'No existe el torneo',
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
      message: 'No existe la asignación del escenario al torneo con id 9',
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

  it('tells whether a venue is assigned to a tournament', async () => {
    repository.existsByTournamentAndVenue.mockResolvedValue(false);

    await expect(service.isVenueAssignedToTournament(1, 2)).resolves.toBe(false);
    expect(repository.existsByTournamentAndVenue).toHaveBeenCalledWith(1, 2);
  });
});
