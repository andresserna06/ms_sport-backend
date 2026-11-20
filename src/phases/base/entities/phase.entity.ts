import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import { Match } from '../../../matches/entities/match.entity';

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

  @OneToMany(() => Match, (match) => match.phase, { cascade: false })
  matches?: Match[];
}