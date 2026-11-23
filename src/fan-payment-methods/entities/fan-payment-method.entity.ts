import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Fan } from '../../fans/entities/fan.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { Bet } from '../../bets/entities/bet.entity';

@Entity('fan_payment_methods')
@Index('UQ_fan_payment_methods_fan_method', ['fanId', 'paymentMethodId'], {
  unique: true,
})
@Index('IDX_fan_payment_methods_payment_method_id', ['paymentMethodId'])
export class FanPaymentMethod {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'fan_id' })
  fanId!: number;

  @Column({ type: 'int', name: 'payment_method_id' })
  paymentMethodId!: number;

  @Column({ type: 'varchar', length: 100, name: 'alias', nullable: true })
  alias!: string | null;

  @ManyToOne(() => Fan, (fan) => fan.fanPaymentMethods, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'fan_id',
    foreignKeyConstraintName: 'FK_fan_payment_methods_fan',
  })
  fan!: Relation<Fan>;

  @ManyToOne(
    () => PaymentMethod,
    (paymentMethod) => paymentMethod.fanPaymentMethods,
    { nullable: false, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' },
  )
  @JoinColumn({
    name: 'payment_method_id',
    foreignKeyConstraintName: 'FK_fan_payment_methods_payment_method',
  })
  paymentMethod!: Relation<PaymentMethod>;

  @OneToMany(() => Bet, (bet) => bet.fanPaymentMethod)
  bets?: Relation<Bet[]>;
}
