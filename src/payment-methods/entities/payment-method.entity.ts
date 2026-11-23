import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { FanPaymentMethod } from '../../fan-payment-methods/entities/fan-payment-method.entity';

@Entity('payment_methods')
@Index('UQ_payment_methods_name', ['name'], { unique: true })
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 60, name: 'name' })
  name!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @OneToMany(
    () => FanPaymentMethod,
    (fanPaymentMethod) => fanPaymentMethod.paymentMethod,
  )
  fanPaymentMethods?: Relation<FanPaymentMethod[]>;
}
