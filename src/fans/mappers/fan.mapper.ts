import { Injectable } from '@nestjs/common';
import { CreateFanDto } from '../dtos/create-fan.dto';
import { FanResponseDto } from '../dtos/fan-response.dto';
import { UpdateFanDto } from '../dtos/update-fan.dto';
import { Fan } from '../entities/fan.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class FanMapper {
  toEntity(dto: CreateFanDto): Fan {
    const entity = new Fan();
    entity.name = dto.name;
    entity.email = dto.email.toLowerCase();
    entity.active = dto.active ?? true;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(entity: Fan, dto: UpdateFanDto): Fan {
    entity.name = dto.name;
    entity.email = dto.email.toLowerCase();
    entity.active = dto.active ?? entity.active;
    return entity;
  }

  toResponseDto(entity: Fan): FanResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      active: entity.active,
    };
  }

  toResponseDtoList(entities: Fan[]): FanResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
