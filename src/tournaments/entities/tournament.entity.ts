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
import { Phase } from '../../phases/base/entities/phase.entity';
import { Sport } from '../../sports/entities/sport.entity';

@Entity('tournaments')
@Index('IDX_tournaments_sport_id', ['sportId'])
@Index('UQ_tournaments_sport_name', ['sportId', 'name'], { unique: true })
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  // The case/accent-insensitive collation makes the UNIQUE(sport, name) index
  // reject "Copa 2027" and "copa 2027" inside the same sport.
  @Column({ length: 120, collation: 'utf8mb4_unicode_ci' })
  name!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'enrollment_deadline' })
  enrollmentDeadline!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'sport_id', type: 'int' })
  sportId!: number;

  @ManyToOne(() => Sport, (sport) => sport.tournaments, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'sport_id',
    foreignKeyConstraintName: 'FK_tournaments_sport',
  })
  sport!: Relation<Sport>;

  @OneToMany(() => Phase, (phase) => phase.tournament)
  phases!: Relation<Phase>[];
}
