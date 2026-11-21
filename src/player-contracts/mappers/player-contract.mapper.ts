import { Injectable } from '@nestjs/common';
import { CreatePlayerContractDto } from '../dtos/create-player-contract.dto';
import {
  ContractPlayerSummaryDto,
  ContractTeamSummaryDto,
  PlayerContractResponseDto,
  PlayerTeamContractResponseDto,
  TeamPlayerContractResponseDto,
} from '../dtos/player-contract-response.dto';
import { PlayerContract } from '../entities/player-contract.entity';

@Injectable()
export class PlayerContractMapper {
  toEntity(teamId: number, dto: CreatePlayerContractDto): PlayerContract {
    const entity = new PlayerContract();
    entity.teamId = teamId;
    entity.playerId = dto.playerId;
    entity.startDate = dto.startDate;
    entity.endDate = dto.endDate ?? null;
    return entity;
  }

  toResponseDto(
    entity: PlayerContract,
    current: boolean,
  ): PlayerContractResponseDto {
    const dto = new PlayerContractResponseDto();
    dto.id = entity.id;
    dto.playerId = entity.playerId;
    dto.teamId = entity.teamId;
    dto.startDate = this.normalizeDate(entity.startDate);
    dto.endDate =
      entity.endDate != null ? this.normalizeDate(entity.endDate) : null;
    dto.current = current;
    return dto;
  }

  toTeamPlayerDto(
    entity: PlayerContract,
    current: boolean,
  ): TeamPlayerContractResponseDto {
    const playerDto = new ContractPlayerSummaryDto();
    playerDto.id = entity.player.id;
    playerDto.userId = entity.player.userId;
    playerDto.document = entity.player.document;
    playerDto.position = entity.player.position;
    playerDto.jerseyNumber = entity.player.jerseyNumber;
    playerDto.active = entity.player.active;

    const dto = new TeamPlayerContractResponseDto();
    dto.id = entity.id;
    dto.playerId = entity.playerId;
    dto.startDate = this.normalizeDate(entity.startDate);
    dto.endDate =
      entity.endDate != null ? this.normalizeDate(entity.endDate) : null;
    dto.current = current;
    dto.player = playerDto;
    return dto;
  }

  toPlayerTeamDto(
    entity: PlayerContract,
    current: boolean,
  ): PlayerTeamContractResponseDto {
    const teamDto = new ContractTeamSummaryDto();
    teamDto.id = entity.team.id;
    teamDto.name = entity.team.name;
    teamDto.city = entity.team.city;
    teamDto.active = entity.team.active;

    const dto = new PlayerTeamContractResponseDto();
    dto.id = entity.id;
    dto.teamId = entity.teamId;
    dto.startDate = this.normalizeDate(entity.startDate);
    dto.endDate =
      entity.endDate != null ? this.normalizeDate(entity.endDate) : null;
    dto.current = current;
    dto.team = teamDto;
    return dto;
  }

  private normalizeDate(value: string | Date): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(value).slice(0, 10);
  }
}
