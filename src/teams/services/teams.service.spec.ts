import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { Team } from '../entities/team.entity';
import { TeamMapper } from '../mappers/team.mapper';
import {
  DuplicateTeamNameError,
  TeamInUseError,
  type TeamAssociations,
  type TeamRepository,
} from '../repositories/team.repository';
import { TeamsService } from './teams.service';

const noAssociations: TeamAssociations = {
  sports: 0,
  contracts: 0,
  matches: 0,
  scoringEvents: 0,
  registrations: 0,
  fans: 0,
};

const errorCase = (error: unknown) => (error as ApplicationException).errorCase;

const buildTeam = (overrides: Partial<Team> = {}): Team =>
  Object.assign(new Team(), {
    id: 1,
    name: 'Atlético',
    city: 'Medellín',
    contactEmail: 'a@b.co',
    foundedYear: null,
    active: true,
    ...overrides,
  });

describe('TeamsService', () => {
  let repository: jest.Mocked<TeamRepository>;
  let service: TeamsService;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByName: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      save: jest.fn(async (team: Team) => team),
      remove: jest.fn().mockResolvedValue(undefined),
      countAssociations: jest.fn().mockResolvedValue(noAssociations),
      findActiveByCityReport: jest.fn().mockResolvedValue([]),
    };
    service = new TeamsService(repository, new TeamMapper());
  });

  it('creates a team', async () => {
    const result = await service.create({
      name: 'Atlético',
      city: 'Medellín',
      contactEmail: 'A@B.co',
    });

    expect(result).toMatchObject({ name: 'Atlético', active: true });
    expect(result.contactEmail).toBe('a@b.co');
  });

  it('rejects a duplicated name', async () => {
    repository.findByName.mockResolvedValue(buildTeam({ id: 9 }));

    await expect(
      service.create({ name: 'Atlético', city: 'X', contactEmail: 'a@b.co' }),
    ).rejects.toMatchObject({ errorCase: ErrorCase.ALREADY_EXISTS });
  });

  it('answers 409 when the unique index rejects a concurrent duplicate', async () => {
    repository.save.mockRejectedValue(new DuplicateTeamNameError());

    await expect(
      service.create({ name: 'Atlético', city: 'X', contactEmail: 'a@b.co' }),
    ).rejects.toMatchObject({ errorCase: ErrorCase.ALREADY_EXISTS });
  });

  it('allows an update that keeps the same name', async () => {
    repository.findById.mockResolvedValue(buildTeam());
    repository.findByName.mockResolvedValue(buildTeam());

    await expect(
      service.update(1, {
        name: 'Atlético',
        city: 'Cali',
        contactEmail: 'x@y.co',
      }),
    ).resolves.toMatchObject({ id: 1, city: 'Cali', foundedYear: null });
  });

  it('rejects an update that takes the name of another team', async () => {
    repository.findById.mockResolvedValue(buildTeam());
    repository.findByName.mockResolvedValue(buildTeam({ id: 2 }));

    await expect(
      service.update(1, { name: 'Otro', city: 'X', contactEmail: 'a@b.co' }),
    ).rejects.toMatchObject({ errorCase: ErrorCase.ALREADY_EXISTS });
  });

  it('returns 404 for an unknown team', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
      message: 'No existe un equipo con el id 1',
    });
  });

  it('passes the active filter to the repository', async () => {
    await service.findAll(false);

    expect(repository.findAll).toHaveBeenCalledWith(false);
  });

  it('activates and deactivates', async () => {
    repository.findById.mockResolvedValue(buildTeam());

    await expect(service.deactivate(1)).resolves.toMatchObject({
      active: false,
    });
    await expect(service.activate(1)).resolves.toMatchObject({ active: true });
  });

  describe('remove', () => {
    it('deletes a team without associations', async () => {
      const team = buildTeam();
      repository.findById.mockResolvedValue(team);

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repository.remove).toHaveBeenCalledWith(team);
    });

    it('lists every kind of association in the 409 message', async () => {
      repository.findById.mockResolvedValue(buildTeam());
      repository.countAssociations.mockResolvedValue({
        sports: 1,
        contracts: 2,
        matches: 1,
        scoringEvents: 3,
        registrations: 2,
        fans: 1,
      });

      const error = await service.remove(1).catch((e: unknown) => e);

      expect(errorCase(error)).toBe(ErrorCase.INVALID_STATE);
      expect((error as Error).message).toBe(
        'No se puede eliminar el equipo "Atlético": tiene 1 deporte asociado, 2 contratos, 1 partido, 3 anotaciones, 2 inscripciones en torneos, 1 aficionado asociado. Desactívelo en su lugar.',
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('only mentions the associations that exist', async () => {
      repository.findById.mockResolvedValue(buildTeam());
      repository.countAssociations.mockResolvedValue({
        ...noAssociations,
        matches: 2,
      });

      await expect(service.remove(1)).rejects.toThrow('tiene 2 partidos.');
    });

    it('answers 409, not 500, when a foreign key blocks the delete', async () => {
      repository.findById.mockResolvedValue(buildTeam());
      repository.remove.mockRejectedValue(new TeamInUseError());

      await expect(service.remove(1)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
      });
    });

    it('rethrows unexpected persistence errors', async () => {
      repository.findById.mockResolvedValue(buildTeam());
      repository.remove.mockRejectedValue(new Error('boom'));

      await expect(service.remove(1)).rejects.toThrow('boom');
    });
  });
});
