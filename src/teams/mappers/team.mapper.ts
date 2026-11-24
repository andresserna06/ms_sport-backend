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
    entity.logo = dto.logo ?? null;
    entity.active = true;
    return entity;
  }

  // PUT replaces every field; an omitted foundedYear or logo clears it.
  replaceEntity(entity: Team, dto: UpdateTeamDto): Team {
    entity.name = dto.name;
    entity.city = dto.city;
    entity.contactEmail = dto.contactEmail.toLowerCase();
    entity.foundedYear = dto.foundedYear ?? null;
    entity.logo = dto.logo ?? null;
    return entity;
  }

  toResponseDto(entity: Team): TeamResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      city: entity.city,
      contactEmail: entity.contactEmail,
      foundedYear: entity.foundedYear,
      logo: entity.logo ?? null,
      active: entity.active,
    };
  }

  toResponseDtoList(entities: Team[]): TeamResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
