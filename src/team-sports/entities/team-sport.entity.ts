import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';
import { Sport } from '../../sports/entities/sport.entity';
import { Team } from '../../teams/entities/team.entity';

// Explicit association entity between Team and Sport (managed by HU-GD-03).
@Entity('team_sports')
@Unique('UQ_team_sports_team_sport', ['teamId', 'sportId'])
@Index('IDX_team_sports_sport_id', ['sportId'])
export class TeamSport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId!: number;

  @Column({ name: 'sport_id', type: 'int' })
  sportId!: number;

  @ManyToOne(() => Team, (team) => team.teamSports, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'team_id',
    foreignKeyConstraintName: 'FK_team_sports_team',
  })
  team!: Relation<Team>;

  @ManyToOne(() => Sport, (sport) => sport.teamSports, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'sport_id',
    foreignKeyConstraintName: 'FK_team_sports_sport',
  })
  sport!: Relation<Sport>;
}
