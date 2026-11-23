import { Injectable } from '@nestjs/common';
import { CreateBallDto } from '../dtos/create-ball.dto';
import { BallResponseDto } from '../dtos/ball-response.dto';
import { UpdateBallDto } from '../dtos/update-ball.dto';
import { Ball } from '../entities/ball.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class BallMapper {
  toEntity(dto: CreateBallDto): Ball {
    const entity = new Ball();
    entity.matchId = dto.matchId;
    entity.serialNumber = dto.serialNumber;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(entity: Ball, dto: UpdateBallDto): Ball {
    entity.matchId = dto.matchId;
    entity.serialNumber = dto.serialNumber;
    return entity;
  }

  toResponseDto(entity: Ball): BallResponseDto {
    return {
      id: entity.id,
      matchId: entity.matchId,
      serialNumber: entity.serialNumber,
    };
  }

  toResponseDtoList(entities: Ball[]): BallResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
