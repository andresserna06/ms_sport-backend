import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Venue } from '../../venues/entities/venue.entity';

@Entity('tournament_venues')
@Index('UQ_tournament_venues_tournament_venue', ['tournamentId', 'venueId'], {
  unique: true,
})
@Index('IDX_tournament_venues_venue_id', ['venueId'])
export class TournamentVenue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'tournament_id' })
  tournamentId!: number;

  @Column({ type: 'int', name: 'venue_id' })
  venueId!: number;

  @ManyToOne(() => Tournament, (tournament) => tournament.tournamentVenues, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'tournament_id',
    foreignKeyConstraintName: 'FK_tournament_venues_tournament',
  })
  tournament!: Relation<Tournament>;

  @ManyToOne(() => Venue, (venue) => venue.tournamentVenues, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'venue_id',
    foreignKeyConstraintName: 'FK_tournament_venues_venue',
  })
  venue!: Relation<Venue>;
}
