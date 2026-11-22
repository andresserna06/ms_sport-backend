import { DataSource, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { DuplicateTeamNameError, TeamInUseError } from './team.repository';
import { TeamTypeOrmRepository } from './team.typeorm.repository';

describe('TeamTypeOrmRepository', () => {
  let orm: { remove: jest.Mock; save: jest.Mock };
  let dataSource: { query: jest.Mock };
  let repository: TeamTypeOrmRepository;

  beforeEach(() => {
    orm = { remove: jest.fn(), save: jest.fn() };
    dataSource = { query: jest.fn() };
    repository = new TeamTypeOrmRepository(
      orm as unknown as Repository<Team>,
      dataSource as unknown as DataSource,
    );
  });

  describe('countAssociations', () => {
    it('counts each table that references the team', async () => {
      dataSource.query.mockImplementation(async (sql: string) => {
        if (sql.includes('`team_sports`')) return [{ total: '1' }];
        if (sql.includes('`player_contracts`')) return [{ total: '2' }];
        if (sql.includes('`matches`')) return [{ total: '3' }];
        return [{ total: '4' }];
      });

      await expect(repository.countAssociations(7)).resolves.toEqual({
        sports: 1,
        contracts: 2,
        matches: 3,
        scoringEvents: 4,
      });
    });

    it('counts a team as home or away in matches', async () => {
      dataSource.query.mockResolvedValue([{ total: '0' }]);

      await repository.countAssociations(7);

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('home_team_id = ? OR away_team_id = ?'),
        [7, 7],
      );
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('`scoring_events`'),
        [7],
      );
    });
  });

  describe('save', () => {
    it('translates ER_DUP_ENTRY to DuplicateTeamNameError', async () => {
      orm.save.mockRejectedValue({ driverError: { code: 'ER_DUP_ENTRY' } });

      await expect(repository.save(new Team())).rejects.toBeInstanceOf(
        DuplicateTeamNameError,
      );
    });

    it('rethrows any other error', async () => {
      const error = new Error('boom');
      orm.save.mockRejectedValue(error);

      await expect(repository.save(new Team())).rejects.toBe(error);
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
