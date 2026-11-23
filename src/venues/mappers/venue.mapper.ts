import { Injectable } from '@nestjs/common';
import { CreateVenueDto } from '../dtos/create-venue.dto';
import { VenueResponseDto } from '../dtos/venue-response.dto';
import { UpdateVenueDto } from '../dtos/update-venue.dto';
import { Venue } from '../entities/venue.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class VenueMapper {
  toEntity(dto: CreateVenueDto): Venue {
    const entity = new Venue();
    entity.name = dto.name;
    entity.city = dto.city;
    entity.address = dto.address ?? null;
    entity.capacity = dto.capacity ?? null;
    entity.active = dto.active ?? true;
    entity.parentVenueId = dto.parentVenueId ?? null;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(entity: Venue, dto: UpdateVenueDto): Venue {
    entity.name = dto.name;
    entity.city = dto.city;
    entity.address = dto.address ?? null;
    entity.capacity = dto.capacity ?? null;
    entity.active = dto.active ?? entity.active;
    entity.parentVenueId = dto.parentVenueId ?? null;
    return entity;
  }

  toResponseDto(entity: Venue): VenueResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      city: entity.city,
      address: entity.address,
      capacity: entity.capacity,
      active: entity.active,
      parentVenueId: entity.parentVenueId,
    };
  }

  toResponseDtoList(entities: Venue[]): VenueResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
