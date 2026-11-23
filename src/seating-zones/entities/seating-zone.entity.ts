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
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Venue } from '../../venues/entities/venue.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('seating_zones')
@Index('UQ_seating_zones_venue_name', ['venueId', 'name'], { unique: true })
export class SeatingZone {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'venue_id' })
  venueId!: number;

  @Column({ type: 'varchar', length: 100, name: 'name' })
  name!: string;

  @Column({ type: 'int', name: 'capacity', nullable: true })
  capacity!: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'price',
    transformer: decimalTransformer,
  })
  price!: number;

  @ManyToOne(() => Venue, (venue) => venue.seatingZones, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'venue_id',
    foreignKeyConstraintName: 'FK_seating_zones_venue',
  })
  venue!: Relation<Venue>;

  @OneToMany(() => Ticket, (ticket) => ticket.seatingZone)
  tickets?: Relation<Ticket[]>;
}
