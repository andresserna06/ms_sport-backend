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
import { Group } from '../../phases/group/entities/group.entity';
import { Registration } from '../../registrations/entities/registration.entity';
import { TeamSport } from '../../team-sports/entities/team-sport.entity';

@Entity('teams')
@Index('UQ_teams_name', ['name'], { unique: true })
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 100 })
  city!: string;

  @Column({ name: 'contact_email', length: 150 })
  contactEmail!: string;

  @Column({ name: 'founded_year', type: 'int', nullable: true })
  foundedYear!: number | null;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => Group, (group) => group.teams, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'group_id' })
  group!: Relation<Group | null>;

  @OneToMany(() => Registration, (registration) => registration.team)
  registrations?: Relation<Registration[]>;

  @OneToMany(() => TeamSport, (teamSport) => teamSport.team)
  teamSports!: Relation<TeamSport>[];
}
