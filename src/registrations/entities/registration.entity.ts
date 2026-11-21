import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';

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

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt!: Date;
}
