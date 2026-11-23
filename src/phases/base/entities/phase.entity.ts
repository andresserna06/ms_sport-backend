import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
  type Relation,
} from 'typeorm';
import type { Match } from '../../../matches/entities/match.entity';
import type { Tournament } from '../../../tournaments/entities/tournament.entity';

export enum FinalRound {
  ROUND_OF_16 = 'ROUND_OF_16',
  QUARTERFINAL = 'QUARTERFINAL',
  SEMIFINAL = 'SEMIFINAL',
  THIRD_PLACE = 'THIRD_PLACE',
  FINAL = 'FINAL',
}

@Entity('phases')
@TableInheritance({ column: { type: 'varchar', name: 'phase_type', length: 10 } })
@Index('IDX_phases_tournament_id', ['tournamentId'])
@Index('UQ_phases_tournament_final_round', ['tournamentId', 'finalRound'], { unique: true })
export abstract class Phase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'int', name: 'phase_order' })
  order!: number;

  @Column({ type: 'int', name: 'tournament_id', nullable: true })
  tournamentId!: number | null;

  @Column({ type: 'enum', enum: FinalRound, name: 'final_round', nullable: true })
  finalRound!: FinalRound | null;

  @ManyToOne('Tournament', 'phases', {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'tournament_id',
    foreignKeyConstraintName: 'FK_phases_tournament',
  })
  tournament!: Relation<Tournament> | null;

  abstract readonly phaseType: 'GROUP' | 'FINAL';

  @OneToMany('Match', 'phase', { cascade: false })
  matches?: Relation<Match[]>;
}
