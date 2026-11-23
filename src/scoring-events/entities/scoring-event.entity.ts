import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { Player } from '../../players/entities/player.entity';
import { Team } from '../../teams/entities/team.entity';

@Entity('scoring_events')
@Check('CHK_scoring_events_minute_non_negative', 'minute >= 0')
@Index('IDX_scoring_events_match_id', ['matchId'])
@Index('IDX_scoring_events_player_id', ['playerId'])
@Index('IDX_scoring_events_team_id', ['teamId'])
export class ScoringEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'match_id', type: 'int' })
  matchId!: number;

  @Column({ name: 'player_id', type: 'int' })
  playerId!: number;

  @Column({ name: 'team_id', type: 'int' })
  teamId!: number;

  @Column({ type: 'int' })
  minute!: number;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @ManyToOne(() => Match, (match) => match.scoringEvents, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @ManyToOne(() => Player, (player) => player.scoringEvents, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @ManyToOne(() => Team, (team) => team.scoringEvents, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;
}
