import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from '../entities/skill.entity';
import { SkillRepository } from './skill.repository';

@Injectable()
export class SkillTypeOrmRepository implements SkillRepository {
  constructor(
    @InjectRepository(Skill)
    private readonly orm: Repository<Skill>,
  ) {}

  async findAll(name?: string): Promise<Skill[]> {
    const qb = this.orm
      .createQueryBuilder('skill')
      .orderBy('skill.id', 'ASC');

    const filter = name?.trim();
    if (filter) {
      qb.where('LOWER(skill.name) LIKE LOWER(:name)', {
        name: `%${filter}%`,
      });
    }

    return qb.getMany();
  }

  async findById(id: number): Promise<Skill | null> {
    return this.orm.findOne({ where: { id } });
  }

  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const qb = this.orm
      .createQueryBuilder('skill')
      .where('LOWER(TRIM(skill.name)) = LOWER(TRIM(:name))', {
        name,
      });

    if (excludeId !== undefined) {
      qb.andWhere('skill.id != :excludeId', { excludeId });
    }

    return (await qb.getCount()) > 0;
  }

  async save(skill: Skill): Promise<Skill> {
    return this.orm.save(skill);
  }

  async remove(skill: Skill): Promise<void> {
    await this.orm.remove(skill);
  }
}
