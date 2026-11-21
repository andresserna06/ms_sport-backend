import { Skill } from '../entities/skill.entity';

export const SKILL_REPOSITORY = Symbol('SKILL_REPOSITORY');

export interface SkillRepository {
  findAll(name?: string): Promise<Skill[]>;
  findById(id: number): Promise<Skill | null>;
  existsByName(name: string, excludeId?: number): Promise<boolean>;
  save(skill: Skill): Promise<Skill>;
  remove(skill: Skill): Promise<void>;
}
