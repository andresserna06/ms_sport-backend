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
@Index('UQ_tournaments_sport_name', ['sportId', 'name'], { unique: true })
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120, collation: 'utf8mb4_unicode_ci' })
  name!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'enrollment_deadline' })
  registrationDeadline!: string;

  @Column({ name: 'sport_id', type: 'int' })
  sportId!: number;

  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.SCHEDULED })
  status!: TournamentStatus;

  @Column({ default: true })
  active!: boolean;

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
  phases?: Relation<Phase[]>;

  @OneToMany(() => Registration, (registration) => registration.tournament)
  registrations?: Relation<Registration[]>;

  canChangeRegistrations(today: string): boolean {
    return this.status === TournamentStatus.SCHEDULED && today <= this.registrationDeadline;
  }
}
