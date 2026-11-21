import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Skill } from '../../skills/entities/skill.entity';

@Entity('player_skills')
@Unique('UQ_player_skills_player_skill', ['playerId', 'skillId'])
@Index('IDX_player_skills_player_id', ['playerId'])
@Index('IDX_player_skills_skill_id', ['skillId'])
export class PlayerSkill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'player_id', type: 'int' })
  playerId!: number;

  @Column({ name: 'skill_id', type: 'int' })
  skillId!: number;

  @Column({ type: 'int', nullable: true })
  level!: number | null;

  @CreateDateColumn({
    name: 'assigned_at',
    type: 'datetime',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
  })
  assignedAt!: Date;

  @ManyToOne(() => Player, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @ManyToOne(() => Skill, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skill_id' })
  skill!: Skill;
}
