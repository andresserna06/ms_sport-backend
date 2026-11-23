import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { SpatialPosition } from '../../spatial-positions/entities/spatial-position.entity';

@Entity('balls')
@Index('UQ_balls_serial_number', ['serialNumber'], { unique: true })
export class Ball {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'match_id' })
  matchId!: number;

  @Column({ type: 'varchar', length: 60, name: 'serial_number' })
  serialNumber!: string;

  @OneToOne(() => Match, (match) => match.ball, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({ name: 'match_id', foreignKeyConstraintName: 'FK_balls_match' })
  match!: Relation<Match>;

  @OneToMany(() => SpatialPosition, (spatialPosition) => spatialPosition.ball)
  spatialPositions?: Relation<SpatialPosition[]>;
}
