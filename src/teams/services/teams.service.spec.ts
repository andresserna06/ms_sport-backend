import { ConflictException, NotFoundException } from '@nestjs/common';
import { Team } from '../entities/team.entity';
import { TeamMapper } from '../mappers/team.mapper';
import { TeamInUseError, TeamRepository } from '../repositories/team.repository';
import { TeamsService } from './teams.service';

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
      countAssociations: jest.fn().mockResolvedValue(0),
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
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows an update that keeps the same name', async () => {
    repository.findById.mockResolvedValue(buildTeam());
    repository.findByName.mockResolvedValue(buildTeam());

    await expect(service.update(1, { name: 'Atlético' })).resolves.toMatchObject({
      id: 1,
    });
  });

  it('returns 404 for an unknown team', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('passes the active filter to the repository', async () => {
    await service.findAll(false);

    expect(repository.findAll).toHaveBeenCalledWith(false);
  });

  it('activates and deactivates', async () => {
    repository.findById.mockResolvedValue(buildTeam());

    await expect(service.deactivate(1)).resolves.toMatchObject({ active: false });
    await expect(service.activate(1)).resolves.toMatchObject({ active: true });
  });

  describe('remove', () => {
    it('deletes a team without associations', async () => {
      const team = buildTeam();
      repository.findById.mockResolvedValue(team);

      await expect(service.remove(1)).resolves.toEqual({
        message: 'Team #1 deleted successfully',
      });
      expect(repository.remove).toHaveBeenCalledWith(team);
    });

    it('refuses to delete a team with associations (409)', async () => {
      repository.findById.mockResolvedValue(buildTeam());
      repository.countAssociations.mockResolvedValue(2);

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('answers 409, not 500, when a foreign key blocks the delete', async () => {
      repository.findById.mockResolvedValue(buildTeam());
      repository.remove.mockRejectedValue(new TeamInUseError());

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unexpected persistence errors', async () => {
      repository.findById.mockResolvedValue(buildTeam());
      repository.remove.mockRejectedValue(new Error('boom'));

      await expect(service.remove(1)).rejects.toThrow('boom');
    });
  });
});
