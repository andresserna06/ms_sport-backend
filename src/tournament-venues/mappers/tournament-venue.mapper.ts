import { Injectable } from '@nestjs/common';
import { CreateTournamentVenueDto } from '../dtos/create-tournament-venue.dto';
import { TournamentVenueResponseDto } from '../dtos/tournament-venue-response.dto';
import { UpdateTournamentVenueDto } from '../dtos/update-tournament-venue.dto';
import { TournamentVenue } from '../entities/tournament-venue.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class TournamentVenueMapper {
  toEntity(dto: CreateTournamentVenueDto): TournamentVenue {
    const entity = new TournamentVenue();
    entity.tournamentId = dto.tournamentId;
    entity.venueId = dto.venueId;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(
    entity: TournamentVenue,
    dto: UpdateTournamentVenueDto,
  ): TournamentVenue {
    entity.tournamentId = dto.tournamentId;
    entity.venueId = dto.venueId;
    return entity;
  }

  toResponseDto(entity: TournamentVenue): TournamentVenueResponseDto {
    return {
      id: entity.id,
      tournamentId: entity.tournamentId,
      venueId: entity.venueId,
    };
  }

  toResponseDtoList(entities: TournamentVenue[]): TournamentVenueResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
