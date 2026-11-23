import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { PlayerContract } from '../../player-contracts/entities/player-contract.entity';
import { PlayerSkill } from '../../player-skills/entities/player-skill.entity';
import { ScoringEvent } from '../../scoring-events/entities/scoring-event.entity';
import { SpatialPosition } from '../../spatial-positions/entities/spatial-position.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'int', unique: true })
  userId!: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  document!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  position!: string | null;

  @Column({ name: 'jersey_number', type: 'int', nullable: true })
  jerseyNumber!: number | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @OneToMany(() => PlayerContract, (contract) => contract.player)
  playerContracts?: Relation<PlayerContract[]>;

  @OneToMany(() => PlayerSkill, (playerSkill) => playerSkill.player)
  playerSkills?: Relation<PlayerSkill[]>;

  @OneToMany(() => ScoringEvent, (scoringEvent) => scoringEvent.player)
  scoringEvents?: Relation<ScoringEvent[]>;

  @OneToMany(() => SpatialPosition, (position) => position.player)
  spatialPositions?: Relation<SpatialPosition[]>;
}
