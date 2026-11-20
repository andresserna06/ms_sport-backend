import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from '../dto/create-team.dto';
import { TeamResponseDto } from '../dto/team-response.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { Team } from '../entities/team.entity';

@Injectable()
export class TeamMapper {
  toEntity(dto: CreateTeamDto): Team {
    const entity = new Team();
    entity.name = dto.name.trim();
    entity.city = dto.city.trim();
    entity.contactEmail = dto.contactEmail.trim().toLowerCase();
    entity.foundedYear = dto.foundedYear ?? null;
    entity.active = true;
    return entity;
  }

  mergeEntity(entity: Team, dto: UpdateTeamDto): Team {
    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.city !== undefined) entity.city = dto.city.trim();
    if (dto.contactEmail !== undefined) {
      entity.contactEmail = dto.contactEmail.trim().toLowerCase();
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
