import { Injectable } from '@nestjs/common';
import { CreateScoringEventDto } from '../dtos/create-scoring-event.dto';
import {
  ScoringEventPlayerSummaryDto,
  ScoringEventResponseDto,
  ScoringEventTeamSummaryDto,
} from '../dtos/scoring-event-response.dto';
import { UpdateScoringEventDto } from '../dtos/update-scoring-event.dto';
import { ScoringEvent } from '../entities/scoring-event.entity';

@Injectable()
export class ScoringEventMapper {
  toEntity(matchId: number, dto: CreateScoringEventDto): ScoringEvent {
    const entity = new ScoringEvent();
    entity.matchId = matchId;
    entity.playerId = dto.playerId;
    entity.teamId = dto.teamId;
    entity.minute = dto.minute;
    entity.type = dto.type.trim();
    return entity;
  }

  mergeEntity(
    entity: ScoringEvent,
    dto: UpdateScoringEventDto,
  ): ScoringEvent {
    entity.playerId = dto.playerId;
    entity.teamId = dto.teamId;
    entity.minute = dto.minute;
    entity.type = dto.type.trim();
    return entity;
  }

  toResponseDto(entity: ScoringEvent): ScoringEventResponseDto {
    const dto = new ScoringEventResponseDto();
    dto.id = entity.id;
    dto.matchId = entity.matchId;
    dto.playerId = entity.playerId;
    dto.teamId = entity.teamId;
    dto.minute = entity.minute;
    dto.type = entity.type;

    if (entity.player) {
      const playerSummary = new ScoringEventPlayerSummaryDto();
      playerSummary.id = entity.player.id;
      playerSummary.document = entity.player.document;
      playerSummary.position = entity.player.position;
      playerSummary.jerseyNumber = entity.player.jerseyNumber;
      dto.player = playerSummary;
    }

    if (entity.team) {
      const teamSummary = new ScoringEventTeamSummaryDto();
      teamSummary.id = entity.team.id;
      teamSummary.name = entity.team.name;
      dto.team = teamSummary;
    }

    return dto;
  }

  toResponseDtoList(entities: ScoringEvent[]): ScoringEventResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
