import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import {
  DuplicateRecordError,
  MissingReferenceError,
  RecordInUseError,
} from '../../common/persistence/database-errors';
import { FanPaymentMethod } from '../entities/fan-payment-method.entity';
import { FanPaymentMethodMapper } from '../mappers/fan-payment-method.mapper';
import type { FanPaymentMethodRepository } from '../repositories/fan-payment-method.repository';
import { FansService } from '../../fans/services/fans.service';
import { PaymentMethodsService } from '../../payment-methods/services/payment-methods.service';
import { FanPaymentMethodsService } from './fan-payment-methods.service';

const dto = { fanId: 1, paymentMethodId: 1, alias: 'Valor' };

describe('FanPaymentMethodsService', () => {
  let repository: jest.Mocked<FanPaymentMethodRepository>;
  let service: FanPaymentMethodsService;
  let fansService: { findOne: jest.Mock };
  let paymentMethodsService: { findOne: jest.Mock };

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      save: jest.fn(async (entity: FanPaymentMethod) =>
        Object.assign(entity, { id: entity.id ?? 1 }),
      ),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    fansService = { findOne: jest.fn().mockResolvedValue({ id: 1, active: true }) };
    paymentMethodsService = {
      findOne: jest.fn().mockResolvedValue({ id: 1, active: true }),
    };
    service = new FanPaymentMethodsService(
      repository,
      new FanPaymentMethodMapper(),
      fansService as unknown as FansService,
      paymentMethodsService as unknown as PaymentMethodsService,
    );
  });

  const existing = () =>
    Object.assign(new FanPaymentMethodMapper().toEntity(dto), { id: 4 });

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

  it('answers 404 naming the missing reference', async () => {
    repository.save.mockRejectedValue(
      new MissingReferenceError('FK_fan_payment_methods_fan'),
    );

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
      message: 'No existe el aficionado',
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
      message: 'No existe el método de pago del aficionado con id 9',
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

  it('answers 409 when the payment method is inactive', async () => {
    paymentMethodsService.findOne.mockResolvedValue({ id: 1, active: false });

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('answers 409 when the fan is inactive', async () => {
    fansService.findOne.mockResolvedValue({ id: 1, active: false });

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
  });
});
