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
import { Sport } from '../../sports/entities/sport.entity';
import { Phase } from '../../phases/base/entities/phase.entity';
import { Registration } from '../../registrations/entities/registration.entity';

export enum TournamentStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

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
  registrationDeadline!: string;

  // Nullable for now so existing rows survive the migration; HU-GC-01 makes it
  // mandatory (and validated in the DTO).
  @Column({ name: 'sport_id', type: 'int', nullable: true })
  sportId!: number | null;

  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.SCHEDULED })
  status!: TournamentStatus;

  @Column({ default: true })
  active!: boolean;

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

  @OneToMany(() => Phase, (phase) => phase.tournament)
  phases?: Relation<Phase[]>;

  @OneToMany(() => Registration, (registration) => registration.tournament)
  registrations?: Relation<Registration[]>;

  canChangeRegistrations(today: string): boolean {
    return this.status === TournamentStatus.SCHEDULED && today <= this.registrationDeadline;
  }
}
