import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Phase } from '../../phases/base/entities/phase.entity';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

@Entity('matches')
@Index('IDX_matches_phase_id', ['phase'])
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

  @ManyToOne(() => Phase, (phase) => phase.matches, {
    cascade: false,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'phase_id',
    foreignKeyConstraintName: 'FK_matches_phase',
  })
  phase!: Phase;
}
