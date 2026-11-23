import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Fan } from '../../fans/entities/fan.entity';
import { Match } from '../../matches/entities/match.entity';
import { FanPaymentMethod } from '../../fan-payment-methods/entities/fan-payment-method.entity';

@Entity('bets')
@Index('IDX_bets_fan_id', ['fanId'])
@Index('IDX_bets_match_id', ['matchId'])
@Index('IDX_bets_fan_payment_method_id', ['fanPaymentMethodId'])
export class Bet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'fan_id' })
  fanId!: number;

  @Column({ type: 'int', name: 'match_id' })
  matchId!: number;

  @Column({ type: 'int', name: 'fan_payment_method_id' })
  fanPaymentMethodId!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'amount',
    transformer: decimalTransformer,
  })
  amount!: number;

  @CreateDateColumn({ name: 'placed_at' })
  placedAt!: Date;

  @ManyToOne(() => Fan, (fan) => fan.bets, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'fan_id', foreignKeyConstraintName: 'FK_bets_fan' })
  fan!: Relation<Fan>;

  @ManyToOne(() => Match, (match) => match.bets, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'match_id', foreignKeyConstraintName: 'FK_bets_match' })
  match!: Relation<Match>;

  @ManyToOne(
    () => FanPaymentMethod,
    (fanPaymentMethod) => fanPaymentMethod.bets,
    { nullable: false, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' },
  )
  @JoinColumn({
    name: 'fan_payment_method_id',
    foreignKeyConstraintName: 'FK_bets_fan_payment_method',
  })
  fanPaymentMethod!: Relation<FanPaymentMethod>;
}
