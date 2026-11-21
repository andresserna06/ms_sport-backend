import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { Sport } from '../entities/sport.entity';
import { SportMapper } from '../mappers/sport.mapper';
import {
  DuplicateSportNameError,
  ParentSportNotFoundError,
  SportDependencies,
  SportInUseError,
  SportRepository,
} from '../repositories/sport.repository';
import { SportsService } from './sports.service';

const noDependencies: SportDependencies = {
  subSports: 0,
  activeSubSports: 0,
  teams: 0,
  tournaments: 0,
};

const buildSport = (overrides: Partial<Sport> = {}): Sport =>
  Object.assign(new Sport(), {
    id: 1,
    name: 'Fútbol',
    description: null,
    active: true,
    parentSportId: null,
    ...overrides,
  });

describe('SportsService', () => {
  let repository: jest.Mocked<SportRepository>;
  let service: SportsService;
  // In-memory "database" shared by findById/findDetail/save.
  let db: Map<number, Sport>;

  const givenSports = (...sports: Sport[]) =>
    sports.forEach((sport) => db.set(sport.id, sport));

  const expectError = async (promise: Promise<unknown>, errorCase: ErrorCase) => {
    await expect(promise).rejects.toBeInstanceOf(ApplicationException);
    await expect(promise).rejects.toMatchObject({ errorCase });
  };

  beforeEach(() => {
    db = new Map();
    repository = {
      findById: jest.fn(async (id: number) => db.get(id) ?? null),
      findDetail: jest.fn(async (id: number) => db.get(id) ?? null),
      findAll: jest.fn().mockResolvedValue([]),
      findSubSports: jest.fn().mockResolvedValue([]),
      existsByName: jest.fn().mockResolvedValue(false),
      countDependencies: jest.fn().mockResolvedValue(noDependencies),
      save: jest.fn(async (sport: Sport) => {
        sport.id = sport.id ?? 99;
        db.set(sport.id, sport);
        return sport;
      }),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    service = new SportsService(repository, new SportMapper());
  });

  describe('create', () => {
    it('creates a root sport and answers with the stored data', async () => {
      const result = await service.create({ name: 'Fútbol' });

      expect(result).toMatchObject({
        id: 99,
        name: 'Fútbol',
        active: true,
        parentSportId: null,
      });
      expect(repository.findDetail).toHaveBeenCalledWith(99);
    });

    it('rejects a duplicated name with ALREADY_EXISTS', async () => {
      repository.existsByName.mockResolvedValue(true);

      await expectError(
        service.create({ name: 'Fútbol' }),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('maps a UNIQUE violation reported by the repository to ALREADY_EXISTS', async () => {
      repository.save.mockRejectedValue(new DuplicateSportNameError());

      await expectError(
        service.create({ name: 'Fútbol' }),
        ErrorCase.ALREADY_EXISTS,
      );
    });

    it('rethrows unexpected persistence errors', async () => {
      repository.save.mockRejectedValue(new Error('boom'));

      await expect(service.create({ name: 'Fútbol' })).rejects.toThrow('boom');
    });

    it('answers NOT_FOUND when the parent is deleted right before saving', async () => {
      givenSports(buildSport({ id: 5 }));
      repository.save.mockRejectedValue(new ParentSportNotFoundError());

      await expectError(
        service.create({ name: 'Sala', parentSportId: 5 }),
        ErrorCase.NOT_FOUND,
      );
    });

    it('rejects a missing parent with NOT_FOUND', async () => {
      await expectError(
        service.create({ name: 'Sala', parentSportId: 5 }),
        ErrorCase.NOT_FOUND,
      );
    });

    it('rejects a parent that is already a sub-sport (single level)', async () => {
      givenSports(buildSport({ id: 5, parentSportId: 2 }));

      await expectError(
        service.create({ name: 'Sala', parentSportId: 5 }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('rejects an inactive parent with INVALID_STATE', async () => {
      givenSports(buildSport({ id: 5, active: false }));

      await expectError(
        service.create({ name: 'Sala', parentSportId: 5 }),
        ErrorCase.INVALID_STATE,
      );
    });

    it('creates a sub-sport under an active root sport', async () => {
      givenSports(buildSport({ id: 5 }));

      const result = await service.create({ name: 'Sala', parentSportId: 5 });

      expect(result.parentSportId).toBe(5);
    });
  });

  describe('findAll', () => {
    it('returns only active sports by default', async () => {
      await service.findAll();

      expect(repository.findAll).toHaveBeenCalledWith({
        active: true,
        name: undefined,
        parentSportId: undefined,
      });
    });

    it('returns inactive sports with active=false', async () => {
      await service.findAll({ active: false });

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
    });

    it('returns every sport with all=true', async () => {
      await service.findAll({ all: true });

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ active: undefined }),
      );
    });

    it('passes the trimmed name and parent filters to the repository', async () => {
      await service.findAll({ name: '  fut ', parentSportId: 3 });

      expect(repository.findAll).toHaveBeenCalledWith({
        active: true,
        name: 'fut',
        parentSportId: 3,
      });
    });

    it('ignores a blank name filter', async () => {
      await service.findAll({ name: '   ' });

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ name: undefined }),
      );
    });
  });

  describe('findOne / findSubSports', () => {
    it('returns NOT_FOUND when the sport does not exist', async () => {
      await expectError(service.findOne(1), ErrorCase.NOT_FOUND);
      await expectError(service.findSubSports(1), ErrorCase.NOT_FOUND);
    });

    it('returns the detail with parent and sub-sports count', async () => {
      const parent = buildSport({ id: 1 });
      givenSports(
        Object.assign(buildSport({ id: 2, name: 'Sala', parentSportId: 1 }), {
          parentSport: parent,
          subSportsCount: 0,
        }),
      );

      const result = await service.findOne(2);

      expect(result.parentSport).toEqual({ id: 1, name: 'Fútbol' });
      expect(result.subSportsCount).toBe(0);
    });

    it('lists the sub-sports of a sport (active ones by default)', async () => {
      givenSports(buildSport());
      repository.findSubSports.mockResolvedValue([
        buildSport({ id: 2, name: 'Sala', parentSportId: 1 }),
      ]);

      const result = await service.findSubSports(1);

      expect(result).toHaveLength(1);
      expect(result[0].parentSportId).toBe(1);
      expect(repository.findSubSports).toHaveBeenCalledWith(1, true);
    });

    it.each([
      [{ active: false }, false],
      [{ all: true }, undefined],
      [{ all: true, active: false }, undefined],
    ])('filters the sub-sports with %p', async (params, expected) => {
      givenSports(buildSport());

      await service.findSubSports(1, params);

      expect(repository.findSubSports).toHaveBeenCalledWith(1, expected);
    });
  });

  describe('update', () => {
    it('returns NOT_FOUND when the sport does not exist', async () => {
      await expectError(service.update(1, { name: 'X' }), ErrorCase.NOT_FOUND);
    });

    it('rejects a sport as its own parent with INVALID_OPERATION', async () => {
      givenSports(buildSport({ id: 1 }));

      await expectError(
        service.update(1, { name: 'Fútbol', parentSportId: 1 }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('rejects turning a sport with sub-sports into a sub-sport', async () => {
      givenSports(buildSport({ id: 1 }), buildSport({ id: 9, name: 'Tenis' }));
      repository.countDependencies.mockResolvedValue({
        ...noDependencies,
        subSports: 2,
      });

      await expectError(
        service.update(1, { name: 'Fútbol', parentSportId: 9 }),
        ErrorCase.INVALID_OPERATION,
      );
    });

    it('rejects an existing name belonging to another sport', async () => {
      givenSports(buildSport({ id: 1 }));
      repository.existsByName.mockResolvedValue(true);

      await expectError(
        service.update(1, { name: 'Tenis' }),
        ErrorCase.ALREADY_EXISTS,
      );
      expect(repository.existsByName).toHaveBeenCalledWith('Tenis', 1);
    });

    it('allows keeping an inactive parent that was already assigned', async () => {
      givenSports(
        buildSport({ id: 2, name: 'Sala', parentSportId: 5 }),
        buildSport({ id: 5, active: false }),
      );

      const result = await service.update(2, {
        name: 'Sala renamed',
        parentSportId: 5,
      });

      expect(result.name).toBe('Sala renamed');
      expect(result.parentSportId).toBe(5);
    });

    it('rejects moving a sport under a different inactive parent', async () => {
      givenSports(
        buildSport({ id: 2, name: 'Sala', parentSportId: 5 }),
        buildSport({ id: 6, name: 'Tenis', active: false }),
      );

      await expectError(
        service.update(2, { name: 'Sala', parentSportId: 6 }),
        ErrorCase.INVALID_STATE,
      );
    });

    it('replaces the whole resource: omitted parent becomes null', async () => {
      givenSports(buildSport({ id: 2, parentSportId: 5 }));

      const result = await service.update(2, { name: 'Sala' });

      expect(result.parentSportId).toBeNull();
    });
  });

  describe('deactivate / activate', () => {
    it('deactivates a sport without active sub-sports', async () => {
      givenSports(buildSport());

      const result = await service.deactivate(1);

      expect(result.active).toBe(false);
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('is idempotent when the sport is already inactive', async () => {
      givenSports(buildSport({ active: false }));

      const result = await service.deactivate(1);

      expect(result.active).toBe(false);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('refuses to deactivate a sport with active sub-sports', async () => {
      givenSports(buildSport());
      repository.countDependencies.mockResolvedValue({
        ...noDependencies,
        subSports: 2,
        activeSubSports: 1,
      });

      await expectError(service.deactivate(1), ErrorCase.INVALID_STATE);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('deactivates a parent whose sub-sports are all inactive', async () => {
      givenSports(buildSport());
      repository.countDependencies.mockResolvedValue({
        ...noDependencies,
        subSports: 2,
        activeSubSports: 0,
      });

      const result = await service.deactivate(1);

      expect(result.active).toBe(false);
    });

    it('activates an inactive root sport', async () => {
      givenSports(buildSport({ active: false }));

      const result = await service.activate(1);

      expect(result.active).toBe(true);
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('activates a sub-sport whose parent is active', async () => {
      givenSports(
        buildSport({ id: 1 }),
        buildSport({ id: 2, parentSportId: 1, active: false }),
      );

      const result = await service.activate(2);

      expect(result.active).toBe(true);
    });

    it('refuses to activate a sub-sport whose parent is inactive', async () => {
      givenSports(
        buildSport({ id: 1, active: false }),
        buildSport({ id: 2, parentSportId: 1, active: false }),
      );

      await expectError(service.activate(2), ErrorCase.INVALID_STATE);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes a sport without dependencies', async () => {
      const sport = buildSport();
      givenSports(sport);

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(sport);
    });

    it('returns NOT_FOUND when the sport does not exist', async () => {
      await expectError(service.remove(1), ErrorCase.NOT_FOUND);
    });

    it.each([
      ['sub-sports', { subSports: 1 }],
      ['associated teams', { teams: 2 }],
      ['tournaments', { tournaments: 3 }],
    ])('refuses to delete a sport with %s', async (_label, partial) => {
      givenSports(buildSport());
      repository.countDependencies.mockResolvedValue({
        ...noDependencies,
        ...partial,
      });

      await expectError(service.remove(1), ErrorCase.INVALID_STATE);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('lists every blocking dependency in the message', async () => {
      givenSports(buildSport());
      repository.countDependencies.mockResolvedValue({
        subSports: 2,
        activeSubSports: 0,
        teams: 1,
        tournaments: 3,
      });

      await expect(service.remove(1)).rejects.toThrow(
        /2 subdeportes, 1 equipo asociado, 3 torneos/,
      );
    });

    it('answers INVALID_STATE when a foreign key blocks the delete after the count', async () => {
      givenSports(buildSport());
      repository.remove.mockRejectedValue(new SportInUseError());

      await expectError(service.remove(1), ErrorCase.INVALID_STATE);
    });

    it('rethrows unexpected persistence errors on delete', async () => {
      givenSports(buildSport());
      repository.remove.mockRejectedValue(new Error('boom'));

      await expect(service.remove(1)).rejects.toThrow('boom');
    });
  });
});
