import { PaymentMethod } from '../entities/payment-method.entity';

export const PAYMENT_METHODS_REPOSITORY = Symbol('PAYMENT_METHODS_REPOSITORY');

export interface PaymentMethodRepository {
  findAll(): Promise<PaymentMethod[]>;
  findById(id: number): Promise<PaymentMethod | null>;
  // Throws DuplicateRecordError or MissingReferenceError (see common/persistence).
  save(entity: PaymentMethod): Promise<PaymentMethod>;
  // Throws RecordInUseError when another record still references it.
  remove(entity: PaymentMethod): Promise<void>;
}
