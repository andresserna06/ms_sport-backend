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
import { Match } from '../../matches/entities/match.entity';
import { SeatingZone } from '../../seating-zones/entities/seating-zone.entity';
import { TournamentVenue } from '../../tournament-venues/entities/tournament-venue.entity';

@Entity('venues')
@Index('IDX_venues_parent_venue_id', ['parentVenueId'])
export class Venue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 120, name: 'name' })
  name!: string;

  @Column({ type: 'varchar', length: 100, name: 'city' })
  city!: string;

  @Column({ type: 'varchar', length: 200, name: 'address', nullable: true })
  address!: string | null;

  @Column({ type: 'int', name: 'capacity', nullable: true })
  capacity!: number | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'int', name: 'parent_venue_id', nullable: true })
  parentVenueId!: number | null;

  @ManyToOne(() => Venue, (venue) => venue.subVenues, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'parent_venue_id',
    foreignKeyConstraintName: 'FK_venues_parent_venue',
  })
  parentVenue!: Relation<Venue> | null;

  @OneToMany(() => Venue, (venue) => venue.parentVenue)
  subVenues?: Relation<Venue[]>;

  @OneToMany(() => Match, (match) => match.venue)
  matches?: Relation<Match[]>;

  @OneToMany(() => SeatingZone, (seatingZone) => seatingZone.venue)
  seatingZones?: Relation<SeatingZone[]>;

  @OneToMany(() => TournamentVenue, (tournamentVenue) => tournamentVenue.venue)
  tournamentVenues?: Relation<TournamentVenue[]>;
}
