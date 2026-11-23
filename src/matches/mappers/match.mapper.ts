import { Injectable } from '@nestjs/common';
import { Phase } from '../../phases/base/entities/phase.entity';
import { CreateMatchDto } from '../dto/create-match.dto';
import { MatchResponseDto } from '../dto/match-response.dto';
import { UpdateMatchDto } from '../dto/update-match.dto';
import { Match, MatchStatus } from '../entities/match.entity';

@Injectable()
export class MatchMapper {
  toEntity(dto: CreateMatchDto, phase: Phase): Match {
    const entity = new Match();
    entity.scheduledAt = new Date(dto.scheduledAt);
    entity.status = MatchStatus.SCHEDULED;
    entity.homeScore = null;
    entity.awayScore = null;
    entity.homeTeamId = dto.homeTeamId ?? null;
    entity.awayTeamId = dto.awayTeamId ?? null;
    entity.venueId = dto.venueId ?? null;
    entity.phase = phase;
    return entity;
  }

  mergeEntity(entity: Match, dto: UpdateMatchDto): Match {
    if (dto.scheduledAt !== undefined) entity.scheduledAt = new Date(dto.scheduledAt);
    if (dto.homeTeamId !== undefined) entity.homeTeamId = dto.homeTeamId;
    if (dto.awayTeamId !== undefined) entity.awayTeamId = dto.awayTeamId;
    if (dto.venueId !== undefined) entity.venueId = dto.venueId;
    return entity;
  }

  toResponseDto(entity: Match, phaseId = entity.phase?.id): MatchResponseDto {
    return {
      id: entity.id,
      scheduledAt: entity.scheduledAt,
      status: entity.status,
      homeScore: entity.homeScore,
      awayScore: entity.awayScore,
      homeTeamId: entity.homeTeamId ?? null,
      awayTeamId: entity.awayTeamId ?? null,
      venueId: entity.venueId ?? null,
      phaseId: phaseId!,
    };
  }

  toResponseDtoList(entities: Match[], phaseId?: number): MatchResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity, phaseId));
  }
}
