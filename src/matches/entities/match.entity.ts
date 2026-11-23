import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Ball } from '../../balls/entities/ball.entity';
import { Bet } from '../../bets/entities/bet.entity';
import { Phase } from '../../phases/base/entities/phase.entity';
import { ScoringEvent } from '../../scoring-events/entities/scoring-event.entity';
import { Team } from '../../teams/entities/team.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Venue } from '../../venues/entities/venue.entity';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

@Entity('matches')
@Index('IDX_matches_phase_id', ['phase'])
@Check(
  'CHK_matches_distinct_teams',
  'home_team_id IS NULL OR away_team_id IS NULL OR home_team_id <> away_team_id',
)
@Index('IDX_matches_home_team_id', ['homeTeamId'])
@Index('IDX_matches_away_team_id', ['awayTeamId'])
@Index('IDX_matches_venue_id', ['venueId'])
export class Match {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'datetime', name: 'scheduled_at' })
  scheduledAt!: Date;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status!: MatchStatus;

  @Column({ type: 'int', name: 'home_score', nullable: true })
  homeScore!: number | null;

  @Column({ type: 'int', name: 'away_score', nullable: true })
  awayScore!: number | null;

  @Column({ type: 'int', name: 'home_team_id', nullable: true })
  homeTeamId!: number | null;

  @Column({ type: 'int', name: 'away_team_id', nullable: true })
  awayTeamId!: number | null;

  @Column({ type: 'int', name: 'venue_id', nullable: true })
  venueId!: number | null;

  @ManyToOne(() => Team, (team) => team.homeMatches, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'home_team_id' })
  homeTeam!: Relation<Team | null>;

  @ManyToOne(() => Team, (team) => team.awayMatches, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'away_team_id' })
  awayTeam!: Relation<Team | null>;

  @ManyToOne(() => Phase, (phase) => phase.matches, {
    cascade: false,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'phase_id',
    foreignKeyConstraintName: 'FK_matches_phase',
  })
  phase!: Relation<Phase>;

  @ManyToOne(() => Venue, (venue) => venue.matches, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'venue_id', foreignKeyConstraintName: 'FK_matches_venue' })
  venue!: Relation<Venue | null>;

  @OneToOne(() => Ball, (ball) => ball.match)
  ball?: Relation<Ball>;

  @OneToMany(() => ScoringEvent, (scoringEvent) => scoringEvent.match)
  scoringEvents?: Relation<ScoringEvent[]>;

  @OneToMany(() => Ticket, (ticket) => ticket.match)
  tickets?: Relation<Ticket[]>;

  @OneToMany(() => Bet, (bet) => bet.match)
  bets?: Relation<Bet[]>;
}
