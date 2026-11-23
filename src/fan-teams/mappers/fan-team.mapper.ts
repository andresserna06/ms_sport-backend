import { Injectable } from '@nestjs/common';
import { CreateFanTeamDto } from '../dtos/create-fan-team.dto';
import { FanTeamResponseDto } from '../dtos/fan-team-response.dto';
import { UpdateFanTeamDto } from '../dtos/update-fan-team.dto';
import { FanTeam } from '../entities/fan-team.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class FanTeamMapper {
  toEntity(dto: CreateFanTeamDto): FanTeam {
    const entity = new FanTeam();
    entity.fanId = dto.fanId;
    entity.teamId = dto.teamId;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(entity: FanTeam, dto: UpdateFanTeamDto): FanTeam {
    entity.fanId = dto.fanId;
    entity.teamId = dto.teamId;
    return entity;
  }

  toResponseDto(entity: FanTeam): FanTeamResponseDto {
    return {
      id: entity.id,
      fanId: entity.fanId,
      teamId: entity.teamId,
    };
  }

  toResponseDtoList(entities: FanTeam[]): FanTeamResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
