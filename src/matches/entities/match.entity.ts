import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Phase } from '../../phases/base/entities/phase.entity';
import { Team } from '../../teams/entities/team.entity';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

@Entity('matches')
@Check(
  'CHK_matches_distinct_teams',
  'home_team_id IS NULL OR away_team_id IS NULL OR home_team_id <> away_team_id',
)
@Index('IDX_matches_home_team_id', ['homeTeamId'])
@Index('IDX_matches_away_team_id', ['awayTeamId'])
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

  @ManyToOne(() => Team, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'home_team_id' })
  homeTeam!: Team | null;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'away_team_id' })
  awayTeam!: Team | null;

  @ManyToOne(() => Phase, (phase) => phase.matches, {
    cascade: false,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'phase_id' })
  phase!: Phase;
}
