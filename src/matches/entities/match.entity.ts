import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

@Entity('matches')
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
}
