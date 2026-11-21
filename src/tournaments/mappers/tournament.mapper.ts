import { Injectable } from '@nestjs/common';
import { CreateTournamentDto } from '../dto/create-tournament.dto';
import { TournamentResponseDto } from '../dto/tournament-response.dto';
import { UpdateTournamentDto } from '../dto/update-tournament.dto';
import { Tournament } from '../entities/tournament.entity';

@Injectable()
export class TournamentMapper {
  toEntity(dto: CreateTournamentDto): Tournament {
    const entity = new Tournament();
    entity.name = dto.name;
    entity.startDate = dto.startDate;
    entity.registrationDeadline = dto.enrollmentDeadline;
    return entity;
  }

  mergeEntity(entity: Tournament, dto: UpdateTournamentDto): Tournament {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.startDate !== undefined) entity.startDate = dto.startDate;
    if (dto.enrollmentDeadline !== undefined) {
      entity.registrationDeadline = dto.enrollmentDeadline;
    }
    return entity;
  }

  toResponseDto(entity: Tournament): TournamentResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      startDate: entity.startDate,
      enrollmentDeadline: entity.registrationDeadline,
    };
  }

  toResponseDtoList(entities: Tournament[]): TournamentResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
