import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import {
  DuplicateRecordError,
  MissingReferenceError,
  RecordInUseError,
} from '../../common/persistence/database-errors';
import { FansService } from '../../fans/services/fans.service';
import { FanPaymentMethodsService } from '../../fan-payment-methods/services/fan-payment-methods.service';
import { Bet } from '../entities/bet.entity';
import { BetMapper } from '../mappers/bet.mapper';
import type { BetRepository } from '../repositories/bet.repository';
import { BetsService } from './bets.service';

const dto = { fanId: 1, matchId: 1, fanPaymentMethodId: 1, amount: 10.5 };

describe('BetsService', () => {
  let repository: jest.Mocked<BetRepository>;
  let service: BetsService;
  let fansService: { findOne: jest.Mock };
  let fanPaymentMethodsService: jest.Mocked<
    Pick<FanPaymentMethodsService, 'findOne'>
  >;

  beforeEach(() => {
    repository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      save: jest.fn(async (entity: Bet) =>
        Object.assign(entity, {
          id: entity.id ?? 1,
          placedAt: new Date('2027-01-01T10:00:00.000Z'),
        }),
      ),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    fansService = { findOne: jest.fn().mockResolvedValue({ id: 1, active: true }) };
    fanPaymentMethodsService = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        fanId: 1,
        paymentMethodId: 1,
        alias: null,
      }),
    };
    service = new BetsService(
      repository,
      new BetMapper(),
      fanPaymentMethodsService as unknown as FanPaymentMethodsService,
      fansService as unknown as FansService,
    );
  });

  it('answers 409 when the fan is inactive', async () => {
    fansService.findOne.mockResolvedValue({ id: 1, active: false });

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('answers 409 when the payment method belongs to another fan', async () => {
    fanPaymentMethodsService.findOne.mockResolvedValue({
      id: 1,
      fanId: 2,
      paymentMethodId: 1,
      alias: null,
    });

    await expect(service.create(dto)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('answers 409 on update when the payment method belongs to another fan', async () => {
    repository.findById.mockResolvedValue(existing());
    fanPaymentMethodsService.findOne.mockResolvedValue({
      id: 1,
      fanId: 2,
      paymentMethodId: 1,
      alias: null,
    });

    await expect(service.update(4, dto)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  const existing = () =>
    Object.assign(new BetMapper().toEntity(dto), {
      id: 4,
      placedAt: new Date('2027-01-01T10:00:00.000Z'),
    });

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
    repository.save.mockRejectedValue(new MissingReferenceError('FK_bets_fan'));

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
      message: 'No existe la apuesta con id 9',
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
