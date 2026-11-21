import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
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

  @OneToMany(() => TeamSport, (teamSport) => teamSport.team)
  teamSports!: Relation<TeamSport>[];
}
