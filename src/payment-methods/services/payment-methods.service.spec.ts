import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import {
  DuplicateRecordError,
  MissingReferenceError,
  RecordInUseError,
} from '../../common/persistence/database-errors';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodMapper } from '../mappers/payment-method.mapper';
import type { PaymentMethodRepository } from '../repositories/payment-method.repository';
import { PaymentMethodsService } from './payment-methods.service';

const dto = { name: 'Valor', active: true };

describe('PaymentMethodsService', () => {
  let repository: jest.Mocked<PaymentMethodRepository>;
  let service: PaymentMethodsService;

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      save: jest.fn(async (entity: PaymentMethod) =>
        Object.assign(entity, { id: entity.id ?? 1 }),
      ),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    service = new PaymentMethodsService(repository, new PaymentMethodMapper());
  });

  const existing = () =>
    Object.assign(new PaymentMethodMapper().toEntity(dto), { id: 4 });

  it('creates a record', async () => {
    await expect(service.create(dto)).resolves.toMatchObject({ id: 1 });
    expect(repository.save).toHaveBeenCalled();
  });

  it('answers 409 when a unique value is repeated', async () => {
    repository.save.mockRejectedValue(new DuplicateRecordError());

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.ALREADY_EXISTS,
    });
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
      message: 'No existe el método de pago con id 9',
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
