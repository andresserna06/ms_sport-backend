import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from '../../phases/group/entities/group.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120, unique: true })
  name!: string;

  @Column({ length: 100 })
  city!: string;

  @Column({ name: 'contact_email', length: 150 })
  contactEmail!: string;

  @Column({ name: 'founded_year', type: 'int', nullable: true })
  foundedYear!: number | null;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => Group, (group) => group.teams, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'group_id' })
  group!: Group | null;
}
