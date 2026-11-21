import { Repository } from 'typeorm';
import { TeamSport } from '../../team-sports/entities/team-sport.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Sport } from '../entities/sport.entity';
import {
  DuplicateSportNameError,
  ParentSportNotFoundError,
  SportInUseError,
} from './sport.repository';
import { SportTypeOrmRepository } from './sport.typeorm.repository';

const buildSport = (overrides: Partial<Sport> = {}): Sport =>
  Object.assign(new Sport(), { id: 1, name: 'Fútbol', ...overrides });

const driverError = (code: string) => ({ driverError: { code } });

describe('SportTypeOrmRepository', () => {
  let queryBuilder: Record<string, jest.Mock>;
  let orm: {
    findOne: jest.Mock;
    exists: jest.Mock;
    count: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
    manager: { count: jest.Mock };
  };
  let repository: SportTypeOrmRepository;

  const givenQueryResult = (
    entities: Sport[],
    raw: { sport_id: number; subSportsCount: string | number }[],
  ) => queryBuilder.getRawAndEntities.mockResolvedValue({ entities, raw });

  beforeEach(() => {
    queryBuilder = {};
    for (const method of [
      'leftJoinAndSelect',
      'addSelect',
      'where',
      'andWhere',
      'orderBy',
    ]) {
      queryBuilder[method] = jest.fn().mockReturnValue(queryBuilder);
    }
    queryBuilder.getRawAndEntities = jest
      .fn()
      .mockResolvedValue({ entities: [], raw: [] });

    orm = {
      findOne: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      manager: { count: jest.fn() },
    };
    repository = new SportTypeOrmRepository(
      orm as unknown as Repository<Sport>,
    );
  });

  describe('findById', () => {
    it('loads the plain entity without relations (safe to modify and save)', async () => {
      const sport = buildSport();
      orm.findOne.mockResolvedValue(sport);

      await expect(repository.findById(1)).resolves.toBe(sport);
      expect(orm.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('findDetail', () => {
    it('attaches the sub-sports count read from the raw row', async () => {
      const sport = buildSport({ id: 7 });
      givenQueryResult([sport], [{ sport_id: 7, subSportsCount: '3' }]);

      const result = await repository.findDetail(7);

      expect(result?.subSportsCount).toBe(3);
      expect(queryBuilder.where).toHaveBeenCalledWith('sport.id = :id', {
        id: 7,
      });
    });

    it('returns null when the sport does not exist', async () => {
      await expect(repository.findDetail(7)).resolves.toBeNull();
    });
  });

  describe('findAll', () => {
    it('adds no filter when none is given', async () => {
      await repository.findAll({});

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('sport.name', 'ASC');
    });

    it('filters by active state', async () => {
      await repository.findAll({ active: false });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'sport.active = :active',
        { active: false },
      );
    });

    it('filters by partial name escaping LIKE wildcards', async () => {
      await repository.findAll({ name: '50%_x' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'sport.name LIKE :name',
        { name: '%50\\%\\_x%' },
      );
    });

    it('filters by parent sport', async () => {
      await repository.findAll({ parentSportId: 4 });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'sport.parentSportId = :parentSportId',
        { parentSportId: 4 },
      );
    });

    it('sets the sub-sports count on every returned sport', async () => {
      givenQueryResult(
        [buildSport({ id: 1 }), buildSport({ id: 2 })],
        [
          { sport_id: 1, subSportsCount: 2 },
          { sport_id: 2, subSportsCount: 0 },
        ],
      );

      const result = await repository.findAll({});

      expect(result.map((sport) => sport.subSportsCount)).toEqual([2, 0]);
    });
  });

  describe('findSubSports', () => {
    it('queries the children of the given sport', async () => {
      await repository.findSubSports(9);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'sport.parentSportId = :parentSportId',
        { parentSportId: 9 },
      );
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('filters the children by active state', async () => {
      await repository.findSubSports(9, false);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'sport.active = :active',
        { active: false },
      );
    });
  });

  describe('existsByName', () => {
    it('checks the name', async () => {
      orm.exists.mockResolvedValue(true);

      await expect(repository.existsByName('Fútbol')).resolves.toBe(true);
      expect(orm.exists).toHaveBeenCalledWith({ where: { name: 'Fútbol' } });
    });

    it('ignores the given id', async () => {
      orm.exists.mockResolvedValue(false);

      await repository.existsByName('Fútbol', 3);

      const { where } = orm.exists.mock.calls[0][0];
      expect(where.name).toBe('Fútbol');
      expect(where.id).toBeDefined();
    });
  });

  describe('countDependencies', () => {
    it('counts sub-sports, active sub-sports, teams and tournaments', async () => {
      orm.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1);
      orm.manager.count.mockResolvedValueOnce(2).mockResolvedValueOnce(5);

      await expect(repository.countDependencies(1)).resolves.toEqual({
        subSports: 4,
        activeSubSports: 1,
        teams: 2,
        tournaments: 5,
      });
      expect(orm.manager.count).toHaveBeenCalledWith(TeamSport, {
        where: { sportId: 1 },
      });
      expect(orm.manager.count).toHaveBeenCalledWith(Tournament, {
        where: { sportId: 1 },
      });
    });
  });

  describe('save', () => {
    it('returns the saved entity', async () => {
      const sport = buildSport();
      orm.save.mockResolvedValue(sport);

      await expect(repository.save(sport)).resolves.toBe(sport);
    });

    it.each([
      ['driverError', driverError('ER_DUP_ENTRY')],
      ['top-level code', { code: 'ER_DUP_ENTRY' }],
    ])(
      'translates ER_DUP_ENTRY (%s) to DuplicateSportNameError',
      async (_label, error) => {
        orm.save.mockRejectedValue(error);

        await expect(repository.save(buildSport())).rejects.toBeInstanceOf(
          DuplicateSportNameError,
        );
      },
    );

    it.each(['ER_NO_REFERENCED_ROW', 'ER_NO_REFERENCED_ROW_2'])(
      'translates %s to ParentSportNotFoundError',
      async (code) => {
        orm.save.mockRejectedValue(driverError(code));

        await expect(repository.save(buildSport())).rejects.toBeInstanceOf(
          ParentSportNotFoundError,
        );
      },
    );

    it('rethrows any other error', async () => {
      const error = new Error('boom');
      orm.save.mockRejectedValue(error);

      await expect(repository.save(buildSport())).rejects.toBe(error);
    });
  });

  describe('remove', () => {
    it('removes the entity', async () => {
      orm.remove.mockResolvedValue(undefined);

      await expect(repository.remove(buildSport())).resolves.toBeUndefined();
    });

    it.each(['ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'])(
      'translates %s to SportInUseError',
      async (code) => {
        orm.remove.mockRejectedValue(driverError(code));

        await expect(repository.remove(buildSport())).rejects.toBeInstanceOf(
          SportInUseError,
        );
      },
    );

    it('rethrows any other error', async () => {
      const error = new Error('boom');
      orm.remove.mockRejectedValue(error);

      await expect(repository.remove(buildSport())).rejects.toBe(error);
    });
  });
});
