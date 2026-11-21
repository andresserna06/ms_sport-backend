import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import { Match } from '../../../matches/entities/match.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';

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

  @ManyToOne(() => Tournament, (tournament) => tournament.phases, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament | null;

  @OneToMany(() => Match, (match) => match.phase, { cascade: false })
  matches?: Match[];
}