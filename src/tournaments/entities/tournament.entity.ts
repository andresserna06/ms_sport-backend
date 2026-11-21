import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Phase } from '../../phases/base/entities/phase.entity';
import { Registration } from '../../registrations/entities/registration.entity';

export enum TournamentStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'int', name: 'sport_id', nullable: true })
  sportId!: number | null;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'enrollment_deadline' })
  registrationDeadline!: string;

  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.SCHEDULED })
  status!: TournamentStatus;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => Phase, (phase) => phase.tournament)
  phases?: Relation<Phase[]>;

  @OneToMany(() => Registration, (registration) => registration.tournament)
  registrations?: Relation<Registration[]>;

  canChangeRegistrations(today: string): boolean {
    return this.status === TournamentStatus.SCHEDULED && today <= this.registrationDeadline;
  }
}