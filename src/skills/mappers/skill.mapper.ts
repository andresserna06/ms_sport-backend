import { Injectable } from '@nestjs/common';
import { CreateSkillDto } from '../dtos/create-skill.dto';
import { SkillResponseDto } from '../dtos/skill-response.dto';
import { UpdateSkillDto } from '../dtos/update-skill.dto';
import { Skill } from '../entities/skill.entity';

@Injectable()
export class SkillMapper {
  toEntity(dto: CreateSkillDto): Skill {
    const entity = new Skill();
    entity.name = dto.name.trim();
    entity.description = dto.description.trim();
    return entity;
  }

  mergeEntity(entity: Skill, dto: UpdateSkillDto): Skill {
    entity.name = dto.name.trim();
    entity.description = dto.description.trim();
    return entity;
  }

  toResponseDto(entity: Skill): SkillResponseDto {
    const dto = new SkillResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    return dto;
  }

  toResponseDtoList(entities: Skill[]): SkillResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
