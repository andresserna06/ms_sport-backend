import { DataSource, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { TeamInUseError } from './team.repository';
import { TeamTypeOrmRepository } from './team.typeorm.repository';

describe('TeamTypeOrmRepository', () => {
  let orm: { remove: jest.Mock };
  let dataSource: { query: jest.Mock };
  let repository: TeamTypeOrmRepository;

  beforeEach(() => {
    orm = { remove: jest.fn() };
    dataSource = { query: jest.fn() };
    repository = new TeamTypeOrmRepository(
      orm as unknown as Repository<Team>,
      dataSource as unknown as DataSource,
    );
  });

  describe('countAssociations', () => {
    it('sums the rows of team_sports and player_contracts that reference the team', async () => {
      dataSource.query.mockResolvedValue([{ total: '3' }]);

      await expect(repository.countAssociations(7)).resolves.toBe(6);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('`team_sports`'),
        [7],
      );
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('`player_contracts`'),
        [7],
      );
    });
  });

  describe('remove', () => {
    it.each(['ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'])(
      'translates %s to TeamInUseError',
      async (code) => {
        orm.remove.mockRejectedValue({ driverError: { code } });

        await expect(repository.remove(new Team())).rejects.toBeInstanceOf(
          TeamInUseError,
        );
      },
    );

    it('rethrows any other error', async () => {
      const error = new Error('boom');
      orm.remove.mockRejectedValue(error);

      await expect(repository.remove(new Team())).rejects.toBe(error);
    });
  });

  describe('findActiveByCityReport', () => {
    it('converts the totals to numbers', async () => {
      dataSource.query.mockResolvedValue([{ city: 'Cali', totalTeams: '4' }]);

      await expect(repository.findActiveByCityReport()).resolves.toEqual([
        { city: 'Cali', totalTeams: 4 },
      ]);
    });
  });
});
