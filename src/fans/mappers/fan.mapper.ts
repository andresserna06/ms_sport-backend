import { Injectable } from '@nestjs/common';
import { CreateFanDto } from '../dtos/create-fan.dto';
import { FanResponseDto } from '../dtos/fan-response.dto';
import { UpdateFanDto } from '../dtos/update-fan.dto';
import { Fan } from '../entities/fan.entity';

@Injectable()
export class FanMapper {
  toEntity(dto: CreateFanDto): Fan {
    const entity = new Fan();
    entity.userId = dto.userId;
    entity.active = dto.active ?? true;
    return entity;
  }

  replaceEntity(entity: Fan, dto: UpdateFanDto): Fan {
    entity.userId = dto.userId;
    entity.active = dto.active ?? entity.active;
    return entity;
  }

  toResponseDto(entity: Fan): FanResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      active: entity.active,
    };
  }

  toResponseDtoList(entities: Fan[]): FanResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
