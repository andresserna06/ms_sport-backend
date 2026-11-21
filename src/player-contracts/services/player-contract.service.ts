import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { PlayerService } from '../../players/services/player.service';
import { TeamResponseDto } from '../../teams/dto/team-response.dto';
import { TeamsService } from '../../teams/teams.service';
import { CreatePlayerContractDto } from '../dtos/create-player-contract.dto';
import { FindContractsQueryDto } from '../dtos/find-contracts-query.dto';
import {
  PlayerContractResponseDto,
  PlayerTeamContractResponseDto,
  TeamPlayerContractResponseDto,
} from '../dtos/player-contract-response.dto';
import { PlayerContractMapper } from '../mappers/player-contract.mapper';
import {
  PLAYER_CONTRACT_REPOSITORY,
  type PlayerContractRepository,
} from '../repositories/player-contract.repository';

@Injectable()
export class PlayerContractService {
  constructor(
    @Inject(PLAYER_CONTRACT_REPOSITORY)
    private readonly contractRepository: PlayerContractRepository,
    private readonly playerService: PlayerService,
    private readonly teamsService: TeamsService,
    private readonly contractMapper: PlayerContractMapper,
  ) {}

  async create(
    teamId: number,
    dto: CreatePlayerContractDto,
  ): Promise<PlayerContractResponseDto> {
    const team = await this.getTeamOrFail(teamId);
    const player = await this.playerService.findOne(dto.playerId);

    if (!team.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se pueden crear contratos en el equipo ${teamId} porque está inactivo`,
      );
    }

    if (!player.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se pueden crear contratos para el jugador ${dto.playerId} porque está inactivo`,
      );
    }

    const startDate = this.normalizeDate(dto.startDate);
    const endDate =
      dto.endDate != null ? this.normalizeDate(dto.endDate) : null;
    if (endDate !== null && endDate < startDate) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'La fecha de fin del contrato no puede ser anterior a la fecha de inicio',
      );
    }

    const existingContracts = await this.contractRepository.findByPlayerAndTeam(
      dto.playerId,
      teamId,
    );
    const hasOverlap = existingContracts.some((existing) =>
      this.intervalsOverlap(
        this.normalizeDate(existing.startDate),
        existing.endDate != null ? this.normalizeDate(existing.endDate) : null,
        startDate,
        endDate,
      ),
    );
    if (hasOverlap) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `El jugador ${dto.playerId} ya tiene un contrato que se cruza con esas fechas en el equipo ${teamId}`,
      );
    }

    const entity = this.contractMapper.toEntity(teamId, {
      playerId: dto.playerId,
      startDate,
      endDate,
    });
    const saved = await this.contractRepository.save(entity);
    const today = this.getTodayDateString();
    return this.contractMapper.toResponseDto(
      saved,
      this.isCurrent(
        this.normalizeDate(saved.startDate),
        saved.endDate != null ? this.normalizeDate(saved.endDate) : null,
        today,
      ),
    );
  }

  async endContract(id: number): Promise<PlayerContractResponseDto> {
    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un contrato con el id ${id}`,
      );
    }

    const today = this.getTodayDateString();
    const startDate = this.normalizeDate(contract.startDate);
    const endDate =
      contract.endDate != null ? this.normalizeDate(contract.endDate) : null;

    if (endDate !== null && endDate <= today) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El contrato ${id} ya se encuentra finalizado`,
      );
    }

    if (startDate > today) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede finalizar el contrato ${id} porque aún no ha iniciado`,
      );
    }

    contract.endDate = today;
    const saved = await this.contractRepository.save(contract);
    return this.contractMapper.toResponseDto(saved, false);
  }

  async findPlayersByTeam(
    teamId: number,
    query: FindContractsQueryDto,
  ): Promise<TeamPlayerContractResponseDto[]> {
    await this.getTeamOrFail(teamId);
    const contracts = await this.contractRepository.findByTeamId(teamId);
    const today = this.getTodayDateString();

    return contracts
      .map((contract) => ({
        contract,
        current: this.isCurrent(
          this.normalizeDate(contract.startDate),
          contract.endDate != null
            ? this.normalizeDate(contract.endDate)
            : null,
          today,
        ),
      }))
      .filter(({ current }) =>
        query.current === undefined ? true : current === query.current,
      )
      .map(({ contract, current }) =>
        this.contractMapper.toTeamPlayerDto(contract, current),
      );
  }

  async findTeamsByPlayer(
    playerId: number,
    query: FindContractsQueryDto,
  ): Promise<PlayerTeamContractResponseDto[]> {
    await this.playerService.findOne(playerId);
    const contracts = await this.contractRepository.findByPlayerId(playerId);
    const today = this.getTodayDateString();

    return contracts
      .map((contract) => ({
        contract,
        current: this.isCurrent(
          this.normalizeDate(contract.startDate),
          contract.endDate != null
            ? this.normalizeDate(contract.endDate)
            : null,
          today,
        ),
      }))
      .filter(({ current }) =>
        query.current === undefined ? true : current === query.current,
      )
      .map(({ contract, current }) =>
        this.contractMapper.toPlayerTeamDto(contract, current),
      );
  }

  async hasActiveContractOnDate(
    playerId: number,
    teamId: number,
    date: string,
  ): Promise<boolean> {
    const normalizedDate = this.normalizeDate(date);
    const contracts = await this.contractRepository.findByPlayerAndTeam(
      playerId,
      teamId,
    );
    return contracts.some((contract) => {
      const start = this.normalizeDate(contract.startDate);
      const end =
        contract.endDate != null ? this.normalizeDate(contract.endDate) : null;
      return start <= normalizedDate && (end === null || end >= normalizedDate);
    });
  }

  private async getTeamOrFail(teamId: number): Promise<TeamResponseDto> {
    try {
      return await this.teamsService.findOne(teamId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ApplicationException(
          ErrorCase.NOT_FOUND,
          `No existe un equipo con el id ${teamId}`,
        );
      }
      throw error;
    }
  }

  private intervalsOverlap(
    startA: string,
    endA: string | null,
    startB: string,
    endB: string | null,
  ): boolean {
    const aReachesB = endA === null || endA >= startB;
    const bReachesA = endB === null || endB >= startA;
    return aReachesB && bReachesA;
  }

  private isCurrent(
    startDate: string,
    endDate: string | null,
    today: string,
  ): boolean {
    return startDate <= today && (endDate === null || endDate > today);
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

  private getTodayDateString(): string {
    return this.normalizeDate(new Date());
  }
}
