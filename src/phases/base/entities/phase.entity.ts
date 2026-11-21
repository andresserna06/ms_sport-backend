import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import type { Relation } from 'typeorm';
import type { Match } from '../../../matches/entities/match.entity';
import type { Tournament } from '../../../tournaments/entities/tournament.entity';

@Entity('phases')
@TableInheritance({ column: { type: 'varchar', name: 'phase_type', length: 10 } })
export abstract class Phase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'int', name: 'phase_order' })
  order!: number;

  abstract readonly phaseType: 'GROUP' | 'FINAL';

  @ManyToOne('Tournament', 'phases', {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Relation<Tournament | null>;

  @OneToMany('Match', 'phase', { cascade: false })
  matches?: Relation<Match[]>;
}