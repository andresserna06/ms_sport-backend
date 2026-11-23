import { FanPaymentMethod } from '../entities/fan-payment-method.entity';

export const FAN_PAYMENT_METHODS_REPOSITORY = Symbol(
  'FAN_PAYMENT_METHODS_REPOSITORY',
);

export interface FanPaymentMethodRepository {
  findAll(): Promise<FanPaymentMethod[]>;
  findById(id: number): Promise<FanPaymentMethod | null>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: FanPaymentMethod): Promise<FanPaymentMethod>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: FanPaymentMethod): Promise<void>;
}
