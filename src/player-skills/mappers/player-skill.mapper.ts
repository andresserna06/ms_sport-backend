import { Injectable } from '@nestjs/common';
import { AssignPlayerSkillDto } from '../dtos/assign-player-skill.dto';
import {
  PlayerAssignedSkillResponseDto,
  PlayerSkillResponseDto,
  PlayerSummaryDto,
  SkillAssignedPlayerResponseDto,
  SkillSummaryDto,
} from '../dtos/player-skill-response.dto';
import { PlayerSkill } from '../entities/player-skill.entity';

@Injectable()
export class PlayerSkillMapper {
  toEntity(
    playerId: number,
    skillId: number,
    dto?: AssignPlayerSkillDto,
  ): PlayerSkill {
    const entity = new PlayerSkill();
    entity.playerId = playerId;
    entity.skillId = skillId;
    entity.level = dto?.level ?? null;
    return entity;
  }

  toResponseDto(entity: PlayerSkill): PlayerSkillResponseDto {
    const dto = new PlayerSkillResponseDto();
    dto.id = entity.id;
    dto.playerId = entity.playerId;
    dto.skillId = entity.skillId;
    dto.level = entity.level;
    dto.assignedAt = this.formatDate(entity.assignedAt);
    return dto;
  }

  toPlayerAssignedSkillDto(
    entity: PlayerSkill,
  ): PlayerAssignedSkillResponseDto {
    const skillDto = new SkillSummaryDto();
    skillDto.id = entity.skill.id;
    skillDto.name = entity.skill.name;
    skillDto.description = entity.skill.description;

    const dto = new PlayerAssignedSkillResponseDto();
    dto.id = entity.id;
    dto.skillId = entity.skillId;
    dto.level = entity.level;
    dto.assignedAt = this.formatDate(entity.assignedAt);
    dto.skill = skillDto;
    return dto;
  }

  toPlayerAssignedSkillDtoList(
    entities: PlayerSkill[],
  ): PlayerAssignedSkillResponseDto[] {
    return entities.map((entity) => this.toPlayerAssignedSkillDto(entity));
  }

  toSkillAssignedPlayerDto(
    entity: PlayerSkill,
  ): SkillAssignedPlayerResponseDto {
    const playerDto = new PlayerSummaryDto();
    playerDto.id = entity.player.id;
    playerDto.userId = entity.player.userId;
    playerDto.document = entity.player.document;
    playerDto.position = entity.player.position;
    playerDto.jerseyNumber = entity.player.jerseyNumber;
    playerDto.active = entity.player.active;

    const dto = new SkillAssignedPlayerResponseDto();
    dto.id = entity.id;
    dto.playerId = entity.playerId;
    dto.level = entity.level;
    dto.assignedAt = this.formatDate(entity.assignedAt);
    dto.player = playerDto;
    return dto;
  }

  toSkillAssignedPlayerDtoList(
    entities: PlayerSkill[],
  ): SkillAssignedPlayerResponseDto[] {
    return entities.map((entity) => this.toSkillAssignedPlayerDto(entity));
  }

  private formatDate(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : String(value);
  }
}
