import { Injectable } from '@nestjs/common';
import { CreateSportDto } from '../dtos/create-sport.dto';
import { SportResponseDto } from '../dtos/sport-response.dto';
import { UpdateSportDto } from '../dtos/update-sport.dto';
import { Sport } from '../entities/sport.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class SportMapper {
  toEntity(dto: CreateSportDto): Sport {
    const entity = new Sport();
    entity.name = dto.name;
    entity.description = this.emptyToNull(dto.description);
    entity.parentSportId = dto.parentSportId ?? null;
    entity.active = true;
    return entity;
  }

  // Full replacement (PUT): omitted optional fields become null.
  mergeEntity(entity: Sport, dto: UpdateSportDto): Sport {
    entity.name = dto.name;
    entity.description = this.emptyToNull(dto.description);
    entity.parentSportId = dto.parentSportId ?? null;
    return entity;
  }

  toResponseDto(entity: Sport): SportResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      active: entity.active,
      parentSportId: entity.parentSportId,
      parentSport: entity.parentSport
        ? { id: entity.parentSport.id, name: entity.parentSport.name }
        : null,
      subSportsCount: entity.subSportsCount ?? 0,
    };
  }

  toResponseDtoList(entities: Sport[]): SportResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }

  private emptyToNull(value?: string | null): string | null {
    return value ? value : null;
  }
}
