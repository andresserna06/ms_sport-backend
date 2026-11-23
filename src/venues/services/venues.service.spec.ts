import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import {
  DuplicateRecordError,
  MissingReferenceError,
  RecordInUseError,
} from '../../common/persistence/database-errors';
import { Venue } from '../entities/venue.entity';
import { VenueMapper } from '../mappers/venue.mapper';
import type { VenueRepository } from '../repositories/venue.repository';
import { VenuesService } from './venues.service';

const dto = {
  name: 'Valor',
  city: 'Valor',
  address: 'Valor',
  capacity: 1,
  active: true,
  parentVenueId: 1,
};

describe('VenuesService', () => {
  let repository: jest.Mocked<VenueRepository>;
  let service: VenuesService;

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([]),
      // Default: the parent venue (id 1) exists, is active and has no ancestors.
      findById: jest.fn().mockResolvedValue(
        Object.assign(new VenueMapper().toEntity({ ...dto, parentVenueId: undefined }), {
          id: 1,
          parentVenueId: null,
        }),
      ),
      save: jest.fn(async (entity: Venue) =>
        Object.assign(entity, { id: entity.id ?? 1 }),
      ),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    service = new VenuesService(repository, new VenueMapper());
  });

  describe('parent venue (proposal)', () => {
    const venue = (id: number, parentVenueId: number | null, active = true) =>
      Object.assign(new VenueMapper().toEntity({ ...dto, active }), {
        id,
        parentVenueId,
      });

    it('answers 400 when a venue is its own parent', async () => {
      repository.findById.mockResolvedValue(venue(4, null));

      await expect(
        service.update(4, { ...dto, parentVenueId: 4 }),
      ).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_OPERATION });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('answers 400 when the new parent is a descendant of the venue', async () => {
      // 4 <- 5 <- 6: making 6 the parent of 4 creates a cycle.
      const venues = new Map([
        [4, venue(4, null)],
        [5, venue(5, 4)],
        [6, venue(6, 5)],
      ]);
      repository.findById.mockImplementation(async (id) => venues.get(id) ?? null);

      await expect(
        service.update(4, { ...dto, parentVenueId: 6 }),
      ).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_OPERATION });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('answers 409 when the new parent is inactive', async () => {
      const venues = new Map([
        [4, venue(4, null)],
        [9, venue(9, null, false)],
      ]);
      repository.findById.mockImplementation(async (id) => venues.get(id) ?? null);

      await expect(
        service.update(4, { ...dto, parentVenueId: 9 }),
      ).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_STATE });
    });

    it('answers 404 when the parent does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.create({ ...dto, parentVenueId: 9 }),
      ).rejects.toMatchObject({ errorCase: ErrorCase.NOT_FOUND });
    });

    it('accepts a valid parent', async () => {
      const venues = new Map([
        [4, venue(4, null)],
        [5, venue(5, null)],
      ]);
      repository.findById.mockImplementation(async (id) => venues.get(id) ?? null);

      await expect(
        service.update(4, { ...dto, parentVenueId: 5 }),
      ).resolves.toMatchObject({ id: 4 });
    });
  });

  const existing = () =>
    Object.assign(new VenueMapper().toEntity(dto), { id: 4 });

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
      new MissingReferenceError('FK_venues_parent_venue'),
    );

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
      message: 'No existe el escenario padre',
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
      message: 'No existe el escenario con id 9',
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
