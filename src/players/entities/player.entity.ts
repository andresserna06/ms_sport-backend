import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
