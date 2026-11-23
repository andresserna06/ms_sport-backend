import { Injectable } from '@nestjs/common';
import { Team } from '../../../teams/entities/team.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { CreateGroupDto } from '../dto/create-group.dto';
import { GroupResponseDto } from '../dto/group-response.dto';
import { GroupTeamResponseDto } from '../dto/group-team-response.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { Group } from '../entities/group.entity';

@Injectable()
export class GroupMapper {
  toEntity(dto: CreateGroupDto, tournamentId: number): Group {
    const entity = new Group();
    entity.name = dto.name;
    entity.order = dto.order;
    entity.finalRound = null;
    entity.tournament = { id: tournamentId } as Tournament;
    return entity;
  }

  mergeEntity(entity: Group, dto: UpdateGroupDto): Group {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.order !== undefined) entity.order = dto.order;
    return entity;
  }

  toResponseDto(entity: Group): GroupResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      order: entity.order,
      tournamentId: entity.tournament?.id ?? null,
      phaseType: 'GROUP',
      finalRound: entity.finalRound ?? null,
      teams: entity.teams
        ? this.toTeamResponseDtoList(entity.teams)
        : undefined,
    };
  }

  toResponseDtoList(entities: Group[]): GroupResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }

  toTeamResponseDto(team: Team): GroupTeamResponseDto {
    return { id: team.id, name: team.name };
  }

  toTeamResponseDtoList(teams: Team[]): GroupTeamResponseDto[] {
    return teams.map((team) => this.toTeamResponseDto(team));
  }
}
