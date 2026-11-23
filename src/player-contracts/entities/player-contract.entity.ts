import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Team } from '../../teams/entities/team.entity';

@Entity('player_contracts')
@Check(
  'CHK_player_contracts_date_range',
  'end_date IS NULL OR end_date >= start_date',
)
@Index('IDX_player_contracts_player_id', ['playerId'])
@Index('IDX_player_contracts_team_id', ['teamId'])
export class PlayerContract {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'player_id', type: 'int' })
  playerId!: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId!: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @ManyToOne(() => Player, (player) => player.playerContracts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @ManyToOne(() => Team, (team) => team.playerContracts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;
}
