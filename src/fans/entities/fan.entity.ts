import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Bet } from '../../bets/entities/bet.entity';
import { FanPaymentMethod } from '../../fan-payment-methods/entities/fan-payment-method.entity';
import { FanTeam } from '../../fan-teams/entities/fan-team.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('fans')
@Index('UQ_fans_user_id', ['userId'], { unique: true })
export class Fan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'user_id' })
  userId!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @OneToMany(() => FanTeam, (fanTeam) => fanTeam.fan)
  fanTeams?: Relation<FanTeam[]>;

  @OneToMany(() => FanPaymentMethod, (fanPaymentMethod) => fanPaymentMethod.fan)
  fanPaymentMethods?: Relation<FanPaymentMethod[]>;

  @OneToMany(() => Ticket, (ticket) => ticket.fan)
  tickets?: Relation<Ticket[]>;

  @OneToMany(() => Bet, (bet) => bet.fan)
  bets?: Relation<Bet[]>;
}
