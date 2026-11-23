import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Fan } from '../../fans/entities/fan.entity';
import { Team } from '../../teams/entities/team.entity';

@Entity('fan_teams')
@Index('UQ_fan_teams_fan_team', ['fanId', 'teamId'], { unique: true })
@Index('IDX_fan_teams_team_id', ['teamId'])
export class FanTeam {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'fan_id' })
  fanId!: number;

  @Column({ type: 'int', name: 'team_id' })
  teamId!: number;

  @ManyToOne(() => Fan, (fan) => fan.fanTeams, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'fan_id', foreignKeyConstraintName: 'FK_fan_teams_fan' })
  fan!: Relation<Fan>;

  @ManyToOne(() => Team, (team) => team.fanTeams, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'team_id',
    foreignKeyConstraintName: 'FK_fan_teams_team',
  })
  team!: Relation<Team>;
}
