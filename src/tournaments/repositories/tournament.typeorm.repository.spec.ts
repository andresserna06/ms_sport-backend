import { DataSource, Repository } from 'typeorm';
import { Tournament } from '../entities/tournament.entity';
import {
  DuplicateTournamentNameError,
  TournamentInUseError,
  TournamentSportMissingError,
} from './tournament.repository';
import { TournamentTypeOrmRepository } from './tournament.typeorm.repository';

describe('TournamentTypeOrmRepository', () => {
  let orm: { save: jest.Mock; remove: jest.Mock };
  let repository: TournamentTypeOrmRepository;

  beforeEach(() => {
    orm = { save: jest.fn(), remove: jest.fn() };
    repository = new TournamentTypeOrmRepository(
      orm as unknown as Repository<Tournament>,
      {} as unknown as DataSource,
    );
  });

  describe('save', () => {
    it('translates ER_DUP_ENTRY to DuplicateTournamentNameError', async () => {
      orm.save.mockRejectedValue({ driverError: { code: 'ER_DUP_ENTRY' } });

      await expect(repository.save(new Tournament())).rejects.toBeInstanceOf(
        DuplicateTournamentNameError,
      );
    });

    it.each(['ER_NO_REFERENCED_ROW', 'ER_NO_REFERENCED_ROW_2'])(
      'translates %s to TournamentSportMissingError',
      async (code) => {
        orm.save.mockRejectedValue({ driverError: { code } });

        await expect(repository.save(new Tournament())).rejects.toBeInstanceOf(
          TournamentSportMissingError,
        );
      },
    );

    it('rethrows any other error', async () => {
      const error = new Error('boom');
      orm.save.mockRejectedValue(error);

      await expect(repository.save(new Tournament())).rejects.toBe(error);
    });
  });

  describe('remove', () => {
    it.each(['ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'])(
      'translates %s to TournamentInUseError',
      async (code) => {
        orm.remove.mockRejectedValue({ driverError: { code } });

        await expect(
          repository.remove(new Tournament()),
        ).rejects.toBeInstanceOf(TournamentInUseError);
      },
    );

    it('rethrows any other error', async () => {
      const error = new Error('boom');
      orm.remove.mockRejectedValue(error);

      await expect(repository.remove(new Tournament())).rejects.toBe(error);
    });
  });
});
