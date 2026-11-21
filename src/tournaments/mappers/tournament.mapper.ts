import { Injectable } from '@nestjs/common';
import { CreateTournamentDto } from '../dtos/create-tournament.dto';
import { TournamentResponseDto } from '../dtos/tournament-response.dto';
import { UpdateTournamentDto } from '../dtos/update-tournament.dto';
import { Tournament } from '../entities/tournament.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class TournamentMapper {
  toEntity(dto: CreateTournamentDto): Tournament {
    const entity = new Tournament();
    entity.name = dto.name;
    entity.sportId = dto.sportId;
    entity.startDate = dto.startDate;
    entity.enrollmentDeadline = dto.enrollmentDeadline;
    entity.active = true;
    return entity;
  }

  // PUT replaces every editable field; `active` is only changed by
  // activate / deactivate.
  replaceEntity(entity: Tournament, dto: UpdateTournamentDto): Tournament {
    entity.name = dto.name;
    entity.sportId = dto.sportId;
    entity.startDate = dto.startDate;
    entity.enrollmentDeadline = dto.enrollmentDeadline;
    return entity;
  }

  // The tournament must be loaded with its sport.
  toResponseDto(entity: Tournament): TournamentResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      sport: { id: entity.sport.id, name: entity.sport.name },
      startDate: entity.startDate,
      enrollmentDeadline: entity.enrollmentDeadline,
      active: entity.active,
    };
  }

  toResponseDtoList(entities: Tournament[]): TournamentResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
