import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreatePlayerDto } from '../dtos/create-player.dto';
import { FindPlayersQueryDto } from '../dtos/find-players-query.dto';
import { PlayerResponseDto } from '../dtos/player-response.dto';
import { UpdatePlayerDto } from '../dtos/update-player.dto';
import { Player } from '../entities/player.entity';
import { PlayerMapper } from '../mappers/player.mapper';
import {
  PLAYER_DEPENDENCIES_CHECKER,
  type PlayerDependenciesChecker,
} from '../repositories/player-dependencies.port';
import {
  PLAYER_REPOSITORY,
  type PlayerRepository,
} from '../repositories/player.repository';

@Injectable()
export class PlayerService {
  constructor(
    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: PlayerRepository,
    @Inject(PLAYER_DEPENDENCIES_CHECKER)
    private readonly dependenciesChecker: PlayerDependenciesChecker,
    private readonly playerMapper: PlayerMapper,
  ) {}

  async create(dto: CreatePlayerDto): Promise<PlayerResponseDto> {
    const normalizedDocument = dto.document.trim();
    await this.ensureDocumentIsAvailable(normalizedDocument);
    await this.ensureUserIdIsAvailable(dto.userId);

    const entity = this.playerMapper.toEntity(dto);
    const saved = await this.playerRepository.save(entity);
    return this.playerMapper.toResponseDto(saved);
  }

  async findAll(query: FindPlayersQueryDto): Promise<PlayerResponseDto[]> {
    const active = query.all ? undefined : (query.active ?? true);
    const players = await this.playerRepository.findAll({
      active,
      document: query.document,
      position: query.position,
    });
    return this.playerMapper.toResponseDtoList(players);
  }

  async findOne(id: number): Promise<PlayerResponseDto> {
    const player = await this.getPlayerOrFail(id);
    return this.playerMapper.toResponseDto(player);
  }

  async update(id: number, dto: UpdatePlayerDto): Promise<PlayerResponseDto> {
    const player = await this.getPlayerOrFail(id);
    await this.ensureDocumentIsAvailable(dto.document.trim(), id);
    await this.ensureUserIdIsAvailable(dto.userId, id);

    const updated = this.playerMapper.mergeEntity(player, dto);
    const saved = await this.playerRepository.save(updated);
    return this.playerMapper.toResponseDto(saved);
  }

  async deactivate(id: number): Promise<PlayerResponseDto> {
    return this.changeStatus(id, false);
  }

  async activate(id: number): Promise<PlayerResponseDto> {
    return this.changeStatus(id, true);
  }

  async remove(id: number): Promise<void> {
    const player = await this.getPlayerOrFail(id);

    const hasDependencies =
      await this.dependenciesChecker.hasAssociatedRecords(id);
    if (hasDependencies) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede eliminar el jugador con documento ${player.document} porque tiene información asociada`,
      );
    }

    await this.playerRepository.remove(player);
  }

  private async changeStatus(
    id: number,
    active: boolean,
  ): Promise<PlayerResponseDto> {
    const player = await this.getPlayerOrFail(id);
    player.active = active;
    const saved = await this.playerRepository.save(player);
    return this.playerMapper.toResponseDto(saved);
  }

  private async getPlayerOrFail(id: number): Promise<Player> {
    const player = await this.playerRepository.findById(id);
    if (!player) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un jugador con el id ${id}`,
      );
    }
    return player;
  }

  private async ensureDocumentIsAvailable(
    document: string,
    excludeId?: number,
  ): Promise<void> {
    const exists = await this.playerRepository.existsByDocument(
      document,
      excludeId,
    );
    if (exists) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe un jugador con el documento ${document}`,
      );
    }
  }

  private async ensureUserIdIsAvailable(
    userId: number,
    excludeId?: number,
  ): Promise<void> {
    const exists = await this.playerRepository.existsByUserId(
      userId,
      excludeId,
    );
    if (exists) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe un jugador asociado al usuario ${userId}`,
      );
    }
  }
}
