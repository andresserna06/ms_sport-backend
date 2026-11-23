import { Injectable } from '@nestjs/common';
import { CreateSeatingZoneDto } from '../dtos/create-seating-zone.dto';
import { SeatingZoneResponseDto } from '../dtos/seating-zone-response.dto';
import { UpdateSeatingZoneDto } from '../dtos/update-seating-zone.dto';
import { SeatingZone } from '../entities/seating-zone.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class SeatingZoneMapper {
  toEntity(dto: CreateSeatingZoneDto): SeatingZone {
    const entity = new SeatingZone();
    entity.venueId = dto.venueId;
    entity.name = dto.name;
    entity.capacity = dto.capacity ?? null;
    entity.price = dto.price;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(entity: SeatingZone, dto: UpdateSeatingZoneDto): SeatingZone {
    entity.venueId = dto.venueId;
    entity.name = dto.name;
    entity.capacity = dto.capacity ?? null;
    entity.price = dto.price;
    return entity;
  }

  toResponseDto(entity: SeatingZone): SeatingZoneResponseDto {
    return {
      id: entity.id,
      venueId: entity.venueId,
      name: entity.name,
      capacity: entity.capacity,
      price: entity.price,
    };
  }

  toResponseDtoList(entities: SeatingZone[]): SeatingZoneResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
