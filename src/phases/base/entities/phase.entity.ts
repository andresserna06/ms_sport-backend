import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';

@Entity('phases')
@TableInheritance({ column: { type: 'varchar', name: 'phase_type', length: 10 } })
export abstract class Phase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'int', name: 'phase_order' })
  order!: number;

  @Column({ type: 'varchar', name: 'phase_type', length: 10 })
  phaseType!: string;
}
