import { Injectable } from '@nestjs/common';
import { CreatePlayerDto } from '../dtos/create-player.dto';
import { PlayerResponseDto } from '../dtos/player-response.dto';
import { UpdatePlayerDto } from '../dtos/update-player.dto';
import { Player } from '../entities/player.entity';

@Injectable()
export class PlayerMapper {
  toEntity(dto: CreatePlayerDto): Player {
    const entity = new Player();
    entity.userId = dto.userId;
    entity.document = dto.document.trim();
    entity.position = dto.position != null ? dto.position.trim() : null;
    entity.jerseyNumber = dto.jerseyNumber ?? null;
    entity.active = true;
    return entity;
  }

  mergeEntity(entity: Player, dto: UpdatePlayerDto): Player {
    entity.userId = dto.userId;
    entity.document = dto.document.trim();
    entity.position = dto.position != null ? dto.position.trim() : null;
    entity.jerseyNumber = dto.jerseyNumber ?? null;
    return entity;
  }

  toResponseDto(entity: Player): PlayerResponseDto {
    const dto = new PlayerResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.document = entity.document;
    dto.position = entity.position;
    dto.jerseyNumber = entity.jerseyNumber;
    dto.active = entity.active;
    return dto;
  }

  toResponseDtoList(entities: Player[]): PlayerResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
