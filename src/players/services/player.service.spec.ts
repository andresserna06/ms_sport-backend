import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { Player } from '../entities/player.entity';
import { PlayerMapper } from '../mappers/player.mapper';
import { PlayerDependenciesChecker } from '../repositories/player-dependencies.port';
import { PlayerRepository } from '../repositories/player.repository';
import { PlayerService } from './player.service';

describe('PlayerService', () => {
  let service: PlayerService;
  let repository: jest.Mocked<PlayerRepository>;
  let dependenciesChecker: jest.Mocked<PlayerDependenciesChecker>;
  let mapper: PlayerMapper;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      existsByDocument: jest.fn(),
      existsByUserId: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    dependenciesChecker = {
      hasAssociatedRecords: jest.fn(),
    };
    mapper = new PlayerMapper();
    service = new PlayerService(repository, dependenciesChecker, mapper);
  });

  it('should create a player when document and userId are available', async () => {
    repository.existsByDocument.mockResolvedValue(false);
    repository.existsByUserId.mockResolvedValue(false);
    repository.save.mockResolvedValue(
      Object.assign(new Player(), {
        id: 1,
        userId: 10,
        document: '1053812345',
        position: 'Delantero',
        jerseyNumber: 9,
        active: true,
      }),
    );

    const result = await service.create({
      userId: 10,
      document: '  1053812345  ',
      position: '  Delantero  ',
      jerseyNumber: 9,
    });

    expect(repository.existsByDocument).toHaveBeenCalledWith(
      '1053812345',
      undefined,
    );
    expect(repository.existsByUserId).toHaveBeenCalledWith(10, undefined);
    expect(result).toEqual({
      id: 1,
      userId: 10,
      document: '1053812345',
      position: 'Delantero',
      jerseyNumber: 9,
      active: true,
    });
  });

  it('should throw ALREADY_EXISTS when document is duplicated', async () => {
    repository.existsByDocument.mockResolvedValue(true);

    await expect(
      service.create({ userId: 10, document: '1053812345' }),
    ).rejects.toMatchObject({
      errorCase: ErrorCase.ALREADY_EXISTS,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw ALREADY_EXISTS when userId is duplicated', async () => {
    repository.existsByDocument.mockResolvedValue(false);
    repository.existsByUserId.mockResolvedValue(true);

    await expect(
      service.create({ userId: 10, document: '1053899999' }),
    ).rejects.toMatchObject({
      errorCase: ErrorCase.ALREADY_EXISTS,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should default findAll to active=true and allow all=true to omit active filter', async () => {
    repository.findAll.mockResolvedValue([]);

    await service.findAll({});
    expect(repository.findAll).toHaveBeenLastCalledWith({
      active: true,
      document: undefined,
      position: undefined,
    });

    await service.findAll({ active: false });
    expect(repository.findAll).toHaveBeenLastCalledWith({
      active: false,
      document: undefined,
      position: undefined,
    });

    await service.findAll({ all: true, active: false });
    expect(repository.findAll).toHaveBeenLastCalledWith({
      active: undefined,
      document: undefined,
      position: undefined,
    });
  });

  it('should throw NOT_FOUND when finding a non-existent player', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toBeInstanceOf(
      ApplicationException,
    );
    await expect(service.findOne(99)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
    });
  });

  it('should update a player validating uniqueness excluding its own id', async () => {
    const existing = Object.assign(new Player(), {
      id: 2,
      userId: 10,
      document: '1053812345',
      position: 'Delantero',
      jerseyNumber: 9,
      active: true,
    });
    repository.findById.mockResolvedValue(existing);
    repository.existsByDocument.mockResolvedValue(false);
    repository.existsByUserId.mockResolvedValue(false);
    repository.save.mockResolvedValue(
      Object.assign(new Player(), {
        id: 2,
        userId: 10,
        document: '1053812345',
        position: 'Mediocampista',
        jerseyNumber: 8,
        active: true,
      }),
    );

    const result = await service.update(2, {
      userId: 10,
      document: '1053812345',
      position: 'Mediocampista',
      jerseyNumber: 8,
    });

    expect(repository.existsByDocument).toHaveBeenCalledWith('1053812345', 2);
    expect(repository.existsByUserId).toHaveBeenCalledWith(10, 2);
    expect(result.position).toBe('Mediocampista');
  });

  it('should deactivate and activate a player', async () => {
    const existing = Object.assign(new Player(), {
      id: 3,
      userId: 12,
      document: '1003',
      position: null,
      jerseyNumber: null,
      active: true,
    });
    repository.findById.mockResolvedValue(existing);
    repository.save.mockImplementation(async (p) => p);

    const deactivated = await service.deactivate(3);
    expect(deactivated.active).toBe(false);

    const activated = await service.activate(3);
    expect(activated.active).toBe(true);
  });

  it('should remove a player when there are no associated records', async () => {
    const existing = Object.assign(new Player(), {
      id: 4,
      userId: 14,
      document: '1004',
      position: 'Defensa',
      jerseyNumber: 4,
      active: true,
    });
    repository.findById.mockResolvedValue(existing);
    dependenciesChecker.hasAssociatedRecords.mockResolvedValue(false);

    await service.remove(4);

    expect(dependenciesChecker.hasAssociatedRecords).toHaveBeenCalledWith(4);
    expect(repository.remove).toHaveBeenCalledWith(existing);
  });

  it('should throw INVALID_STATE when removing a player with associated records', async () => {
    const existing = Object.assign(new Player(), {
      id: 4,
      userId: 14,
      document: '1004',
      position: 'Defensa',
      jerseyNumber: 4,
      active: true,
    });
    repository.findById.mockResolvedValue(existing);
    dependenciesChecker.hasAssociatedRecords.mockResolvedValue(true);

    await expect(service.remove(4)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
