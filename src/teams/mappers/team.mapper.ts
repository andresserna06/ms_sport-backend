import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from '../dtos/create-team.dto';
import { TeamResponseDto } from '../dtos/team-response.dto';
import { UpdateTeamDto } from '../dtos/update-team.dto';
import { Team } from '../entities/team.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class TeamMapper {
  toEntity(dto: CreateTeamDto): Team {
    const entity = new Team();
    entity.name = dto.name;
    entity.city = dto.city;
    entity.contactEmail = dto.contactEmail.toLowerCase();
    entity.foundedYear = dto.foundedYear ?? null;
    entity.active = true;
    return entity;
  }

  mergeEntity(entity: Team, dto: UpdateTeamDto): Team {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.city !== undefined) entity.city = dto.city;
    if (dto.contactEmail !== undefined) {
      entity.contactEmail = dto.contactEmail.toLowerCase();
    }
    if (dto.foundedYear !== undefined) entity.foundedYear = dto.foundedYear;
    return entity;
  }

  toResponseDto(entity: Team): TeamResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      city: entity.city,
      contactEmail: entity.contactEmail,
      foundedYear: entity.foundedYear,
      active: entity.active,
    };
  }

  toResponseDtoList(entities: Team[]): TeamResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
