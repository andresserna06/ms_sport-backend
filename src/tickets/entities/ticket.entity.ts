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
import { SeatingZone } from '../../seating-zones/entities/seating-zone.entity';

@Entity('tickets')
@Index('IDX_tickets_fan_id', ['fanId'])
@Index('IDX_tickets_match_id', ['matchId'])
@Index('IDX_tickets_seating_zone_id', ['seatingZoneId'])
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'fan_id' })
  fanId!: number;

  @Column({ type: 'int', name: 'match_id' })
  matchId!: number;

  @Column({ type: 'int', name: 'seating_zone_id' })
  seatingZoneId!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'price',
    transformer: decimalTransformer,
  })
  price!: number;

  @CreateDateColumn({ name: 'purchased_at' })
  purchasedAt!: Date;

  @ManyToOne(() => Fan, (fan) => fan.tickets, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'fan_id', foreignKeyConstraintName: 'FK_tickets_fan' })
  fan!: Relation<Fan>;

  @ManyToOne(() => Match, (match) => match.tickets, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'match_id',
    foreignKeyConstraintName: 'FK_tickets_match',
  })
  match!: Relation<Match>;

  @ManyToOne(() => SeatingZone, (seatingZone) => seatingZone.tickets, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'seating_zone_id',
    foreignKeyConstraintName: 'FK_tickets_seating_zone',
  })
  seatingZone!: Relation<SeatingZone>;
}
