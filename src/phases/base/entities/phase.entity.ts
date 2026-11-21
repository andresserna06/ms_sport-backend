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
import { Match } from '../../../matches/entities/match.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';

@Entity('phases')
@TableInheritance({ column: { type: 'varchar', name: 'phase_type', length: 10 } })
@Index('IDX_phases_tournament_id', ['tournamentId'])
export abstract class Phase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'int', name: 'phase_order' })
  order!: number;

  // Nullable for now: the phases module does not set it yet. HU-GC-01 only
  // needs it to know which phases block the deletion of a tournament.
  @Column({ type: 'int', name: 'tournament_id', nullable: true })
  tournamentId!: number | null;

  @ManyToOne(() => Tournament, (tournament) => tournament.phases, {
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

  @OneToMany(() => Match, (match) => match.phase, { cascade: false })
  matches?: Match[];
}
