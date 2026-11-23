import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Ball } from '../../balls/entities/ball.entity';
import { Player } from '../../players/entities/player.entity';

@Entity('spatial_positions')
@Index('IDX_spatial_positions_ball_id', ['ballId'])
@Index('IDX_spatial_positions_player_id', ['playerId'])
export class SpatialPosition {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'ball_id' })
  ballId!: number;

  @Column({ type: 'int', name: 'player_id' })
  playerId!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    name: 'x',
    transformer: decimalTransformer,
  })
  x!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    name: 'y',
    transformer: decimalTransformer,
  })
  y!: number;

  @Column({ type: 'datetime', precision: 6, name: 'recorded_at' })
  recordedAt!: Date;

  @ManyToOne(() => Ball, (ball) => ball.spatialPositions, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'ball_id',
    foreignKeyConstraintName: 'FK_spatial_positions_ball',
  })
  ball!: Relation<Ball>;

  @ManyToOne(() => Player, (player) => player.spatialPositions, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'player_id',
    foreignKeyConstraintName: 'FK_spatial_positions_player',
  })
  player!: Relation<Player>;
}
