import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { Skill } from '../entities/skill.entity';
import { SkillMapper } from '../mappers/skill.mapper';
import { SkillDependenciesChecker } from '../repositories/skill-dependencies.port';
import { SkillRepository } from '../repositories/skill.repository';
import { SkillService } from './skill.service';

describe('SkillService', () => {
  let service: SkillService;
  let repository: jest.Mocked<SkillRepository>;
  let dependenciesChecker: jest.Mocked<SkillDependenciesChecker>;
  let mapper: SkillMapper;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      existsByName: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    dependenciesChecker = {
      hasAssociatedPlayers: jest.fn(),
    };
    mapper = new SkillMapper();
    service = new SkillService(repository, dependenciesChecker, mapper);
  });

  it('should create a skill when name is available', async () => {
    repository.existsByName.mockResolvedValue(false);
    repository.save.mockResolvedValue(
      Object.assign(new Skill(), {
        id: 1,
        name: 'Speed',
        description: 'Fast movement on the field',
      }),
    );

    const result = await service.create({
      name: '  Speed  ',
      description: '  Fast movement on the field  ',
    });

    expect(repository.existsByName).toHaveBeenCalledWith('Speed', undefined);
    expect(result).toEqual({
      id: 1,
      name: 'Speed',
      description: 'Fast movement on the field',
    });
  });

  it('should throw ALREADY_EXISTS when creating a duplicate skill name', async () => {
    repository.existsByName.mockResolvedValue(true);

    await expect(
      service.create({
        name: 'speed',
        description: 'Any description',
      }),
    ).rejects.toMatchObject({
      errorCase: ErrorCase.ALREADY_EXISTS,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should list skills with optional name filter', async () => {
    repository.findAll.mockResolvedValue([
      Object.assign(new Skill(), {
        id: 1,
        name: 'Speed',
        description: 'Desc 1',
      }),
    ]);

    const result = await service.findAll('spe');

    expect(repository.findAll).toHaveBeenCalledWith('spe');
    expect(result).toEqual([{ id: 1, name: 'Speed', description: 'Desc 1' }]);
  });

  it('should throw NOT_FOUND when finding a non-existent skill', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toBeInstanceOf(
      ApplicationException,
    );
    await expect(service.findOne(99)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
    });
  });

  it('should update a skill checking uniqueness excluding its own id', async () => {
    const existing = Object.assign(new Skill(), {
      id: 2,
      name: 'Speed',
      description: 'Old description',
    });
    repository.findById.mockResolvedValue(existing);
    repository.existsByName.mockResolvedValue(false);
    repository.save.mockResolvedValue(
      Object.assign(new Skill(), {
        id: 2,
        name: 'Speed',
        description: 'New description',
      }),
    );

    const result = await service.update(2, {
      name: 'Speed',
      description: 'New description',
    });

    expect(repository.existsByName).toHaveBeenCalledWith('Speed', 2);
    expect(result).toEqual({
      id: 2,
      name: 'Speed',
      description: 'New description',
    });
  });

  it('should remove a skill when it has no associated players', async () => {
    const existing = Object.assign(new Skill(), {
      id: 4,
      name: 'Stamina',
      description: 'Physical endurance',
    });
    repository.findById.mockResolvedValue(existing);
    dependenciesChecker.hasAssociatedPlayers.mockResolvedValue(false);

    await service.remove(4);

    expect(dependenciesChecker.hasAssociatedPlayers).toHaveBeenCalledWith(4);
    expect(repository.remove).toHaveBeenCalledWith(existing);
  });

  it('should throw INVALID_STATE when removing a skill with associated players', async () => {
    const existing = Object.assign(new Skill(), {
      id: 4,
      name: 'Stamina',
      description: 'Physical endurance',
    });
    repository.findById.mockResolvedValue(existing);
    dependenciesChecker.hasAssociatedPlayers.mockResolvedValue(true);

    await expect(service.remove(4)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
