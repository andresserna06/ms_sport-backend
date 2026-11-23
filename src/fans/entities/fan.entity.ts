import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { FanTeam } from '../../fan-teams/entities/fan-team.entity';
import { FanPaymentMethod } from '../../fan-payment-methods/entities/fan-payment-method.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Bet } from '../../bets/entities/bet.entity';

@Entity('fans')
@Index('UQ_fans_email', ['email'], { unique: true })
export class Fan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120, name: 'name' })
  name!: string;

  @Column({ type: 'varchar', length: 150, name: 'email' })
  email!: string;

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
