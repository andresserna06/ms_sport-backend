import { Repository } from 'typeorm';
import { TeamSport } from '../entities/team-sport.entity';
import {
  DuplicateTeamSportError,
  TeamSportTargetMissingError,
} from './team-sport.repository';
import { TeamSportTypeOrmRepository } from './team-sport.typeorm.repository';

describe('TeamSportTypeOrmRepository', () => {
  let orm: { save: jest.Mock; create: jest.Mock };
  let repository: TeamSportTypeOrmRepository;

  beforeEach(() => {
    orm = {
      save: jest.fn(),
      create: jest.fn((value: object) => Object.assign(new TeamSport(), value)),
    };
    repository = new TeamSportTypeOrmRepository(
      orm as unknown as Repository<TeamSport>,
    );
  });

  describe('create', () => {
    it('saves the pair', async () => {
      orm.save.mockImplementation(async (value: TeamSport) => value);

      await expect(repository.create(1, 2)).resolves.toMatchObject({
        teamId: 1,
        sportId: 2,
      });
    });

    it('translates ER_DUP_ENTRY to DuplicateTeamSportError', async () => {
      orm.save.mockRejectedValue({ driverError: { code: 'ER_DUP_ENTRY' } });

      await expect(repository.create(1, 2)).rejects.toBeInstanceOf(
        DuplicateTeamSportError,
      );
    });

    it.each(['ER_NO_REFERENCED_ROW', 'ER_NO_REFERENCED_ROW_2'])(
      'translates %s to TeamSportTargetMissingError',
      async (code) => {
        orm.save.mockRejectedValue({ driverError: { code } });

        await expect(repository.create(1, 2)).rejects.toBeInstanceOf(
          TeamSportTargetMissingError,
        );
      },
    );

    it('rethrows any other error', async () => {
      const error = new Error('boom');
      orm.save.mockRejectedValue(error);

      await expect(repository.create(1, 2)).rejects.toBe(error);
    });
  });
});
