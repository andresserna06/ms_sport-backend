import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Sport } from '../../sports/entities/sport.entity';

@Entity('tournaments')
@Index('IDX_tournaments_sport_id', ['sportId'])
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'enrollment_deadline' })
  enrollmentDeadline!: string;

  // Nullable for now so existing rows survive the migration; HU-GC-01 makes it
  // mandatory (and validated in the DTO).
  @Column({ name: 'sport_id', type: 'int', nullable: true })
  sportId!: number | null;

  @ManyToOne(() => Sport, (sport) => sport.tournaments, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'sport_id',
    foreignKeyConstraintName: 'FK_tournaments_sport',
  })
  sport!: Relation<Sport> | null;
}
