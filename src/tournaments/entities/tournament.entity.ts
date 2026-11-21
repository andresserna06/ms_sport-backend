import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Phase } from '../../phases/base/entities/phase.entity';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'enrollment_deadline' })
  enrollmentDeadline!: string;

  @OneToMany(() => Phase, (phase) => phase.tournament)
  phases?: Phase[];
}
