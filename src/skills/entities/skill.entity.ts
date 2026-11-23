import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { PlayerSkill } from '../../player-skills/entities/player-skill.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @OneToMany(() => PlayerSkill, (playerSkill) => playerSkill.skill)
  playerSkills?: Relation<PlayerSkill[]>;
}
