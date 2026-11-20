import { Injectable } from '@nestjs/common';
import { CreateMatchDto } from '../dto/create-match.dto';
import { MatchResponseDto } from '../dto/match-response.dto';
import { UpdateMatchDto } from '../dto/update-match.dto';
import { Match, MatchStatus } from '../entities/match.entity';

@Injectable()
export class MatchMapper {
  toEntity(dto: CreateMatchDto): Match {
    const entity = new Match();
    entity.scheduledAt = new Date(dto.scheduledAt);
    entity.status = MatchStatus.SCHEDULED;
    entity.homeScore = null;
    entity.awayScore = null;
    return entity;
  }

  mergeEntity(entity: Match, dto: UpdateMatchDto): Match {
    if (dto.scheduledAt !== undefined) entity.scheduledAt = new Date(dto.scheduledAt);
    if (dto.status !== undefined) entity.status = dto.status;
    if (dto.homeScore !== undefined) entity.homeScore = dto.homeScore;
    if (dto.awayScore !== undefined) entity.awayScore = dto.awayScore;
    return entity;
  }

  toResponseDto(entity: Match): MatchResponseDto {
    return {
      id: entity.id,
      scheduledAt: entity.scheduledAt,
      status: entity.status,
      homeScore: entity.homeScore,
      awayScore: entity.awayScore,
    };
  }

  toResponseDtoList(entities: Match[]): MatchResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
