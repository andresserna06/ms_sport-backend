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
import { TeamSport } from '../../team-sports/entities/team-sport.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';

@Entity('sports')
@Index('UQ_sports_name', ['name'], { unique: true })
@Index('IDX_sports_parent_sport_id', ['parentSportId'])
export class Sport {
  @PrimaryGeneratedColumn()
  id!: number;

  // The case/accent-insensitive collation makes the UNIQUE index reject
  // "Futbol", "futbol" and "Fútbol" as duplicates.
  @Column({ length: 120, collation: 'utf8mb4_unicode_ci' })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'parent_sport_id', type: 'int', nullable: true })
  parentSportId!: number | null;

  @ManyToOne(() => Sport, (sport) => sport.subSports, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'parent_sport_id',
    foreignKeyConstraintName: 'FK_sports_parent_sport',
  })
  parentSport!: Relation<Sport> | null;

  @OneToMany(() => Sport, (sport) => sport.parentSport)
  subSports!: Relation<Sport>[];

  @OneToMany(() => Tournament, (tournament) => tournament.sport)
  tournaments!: Relation<Tournament>[];

  @OneToMany(() => TeamSport, (teamSport) => teamSport.sport)
  teamSports!: Relation<TeamSport>[];

  // Not a column: filled by the repository on read queries.
  subSportsCount?: number;
}
