import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';

export enum RegistrationStatus {
  CONFIRMED = 'CONFIRMED',
  WITHDRAWN = 'WITHDRAWN',
}

@Entity('registrations')
@Unique(['team', 'tournament'])
export class Registration {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Team, (team) => team.registrations, {
    cascade: false,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'team_id' })
  team!: Relation<Team>;

  @ManyToOne(() => Tournament, (tournament) => tournament.registrations, {
    cascade: false,
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Relation<Tournament>;

  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.CONFIRMED })
  status!: RegistrationStatus;

  @Column({ name: 'withdrawn_at', type: 'datetime', nullable: true })
  withdrawnAt!: Date | null;

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt!: Date;
}
