import { Injectable } from '@nestjs/common';
import { CreateSpatialPositionDto } from '../dtos/create-spatial-position.dto';
import { SpatialPositionResponseDto } from '../dtos/spatial-position-response.dto';
import { UpdateSpatialPositionDto } from '../dtos/update-spatial-position.dto';
import { SpatialPosition } from '../entities/spatial-position.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class SpatialPositionMapper {
  toEntity(dto: CreateSpatialPositionDto): SpatialPosition {
    const entity = new SpatialPosition();
    entity.ballId = dto.ballId;
    entity.playerId = dto.playerId;
    entity.x = dto.x;
    entity.y = dto.y;
    entity.recordedAt = new Date(dto.recordedAt);
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(
    entity: SpatialPosition,
    dto: UpdateSpatialPositionDto,
  ): SpatialPosition {
    entity.ballId = dto.ballId;
    entity.playerId = dto.playerId;
    entity.x = dto.x;
    entity.y = dto.y;
    entity.recordedAt = new Date(dto.recordedAt);
    return entity;
  }

  toResponseDto(entity: SpatialPosition): SpatialPositionResponseDto {
    return {
      id: entity.id,
      ballId: entity.ballId,
      playerId: entity.playerId,
      x: entity.x,
      y: entity.y,
      recordedAt: entity.recordedAt.toISOString(),
    };
  }

  toResponseDtoList(entities: SpatialPosition[]): SpatialPositionResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
