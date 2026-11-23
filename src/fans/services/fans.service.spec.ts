import {
  DuplicateRecordError,
  RecordInUseError,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { Fan } from '../entities/fan.entity';
import { FanMapper } from '../mappers/fan.mapper';
import type { FanRoleAssigner } from '../ports/fan-role-assigner.port';
import type { FanRepository } from '../repositories/fan.repository';
import { FansService } from './fans.service';

const dto = { userId: 10, active: true };

describe('FansService', () => {
  let repository: jest.Mocked<FanRepository>;
  let fanRoleAssigner: jest.Mocked<FanRoleAssigner>;
  let service: FansService;

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      save: jest.fn(async (entity: Fan) =>
        Object.assign(entity, { id: entity.id ?? 1 }),
      ),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    fanRoleAssigner = {
      assignFanRole: jest.fn().mockResolvedValue(undefined),
    };
    service = new FansService(repository, fanRoleAssigner, new FanMapper());
  });

  const existing = () =>
    Object.assign(new FanMapper().toEntity(dto), { id: 4 });

  it('creates a record and assigns fan role in ms_seguridad', async () => {
    await expect(
      service.create(dto, 'Bearer jwt-token'),
    ).resolves.toMatchObject({ id: 1, userId: 10, active: true });
    expect(repository.save).toHaveBeenCalled();
    expect(fanRoleAssigner.assignFanRole).toHaveBeenCalledWith(
      10,
      'Bearer jwt-token',
    );
  });

  it('answers 409 when a unique value is repeated', async () => {
    repository.save.mockRejectedValue(new DuplicateRecordError());

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.ALREADY_EXISTS,
    });
    expect(fanRoleAssigner.assignFanRole).not.toHaveBeenCalled();
  });

  it('lists the records', async () => {
    repository.findAll.mockResolvedValue([existing()]);

    await expect(service.findAll()).resolves.toHaveLength(1);
  });

  it('answers 404 for an unknown id', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(9)).rejects.toBeInstanceOf(
      ApplicationException,
    );
    await expect(service.findOne(9)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
      message: 'No existe el aficionado con id 9',
    });
  });

  it('updates a record', async () => {
    repository.findById.mockResolvedValue(existing());

    await expect(service.update(4, dto)).resolves.toMatchObject({ id: 4 });
  });

  it('removes a record', async () => {
    repository.findById.mockResolvedValue(existing());

    await expect(service.remove(4)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalled();
  });

  it('answers 409 when the record is still referenced', async () => {
    repository.findById.mockResolvedValue(existing());
    repository.remove.mockRejectedValue(new RecordInUseError());

    await expect(service.remove(4)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
  });

  it('rethrows unexpected errors', async () => {
    repository.findById.mockResolvedValue(existing());
    repository.remove.mockRejectedValue(new Error('boom'));

    await expect(service.remove(4)).rejects.toThrow('boom');
  });
});
