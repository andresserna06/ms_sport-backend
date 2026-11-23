import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { BallsService } from '../../balls/services/balls.service';
import { MatchStatus } from '../../matches/entities/match.entity';
import { MatchesService } from '../../matches/matches.service';
import { CreateSpatialPositionDto } from '../dtos/create-spatial-position.dto';
import { SpatialPositionResponseDto } from '../dtos/spatial-position-response.dto';
import { UpdateSpatialPositionDto } from '../dtos/update-spatial-position.dto';
import { SpatialPosition } from '../entities/spatial-position.entity';
import { SpatialPositionMapper } from '../mappers/spatial-position.mapper';
import {
  SPATIAL_POSITIONS_REPOSITORY,
  type SpatialPositionRepository,
} from '../repositories/spatial-position.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'la posición espacial',
  duplicate: 'Ya existe la posición espacial con esos datos',
  references: {
    FK_spatial_positions_ball: 'la pelota',
    FK_spatial_positions_player: 'el jugador',
  },
};

@Injectable()
export class SpatialPositionsService {
  constructor(
    @Inject(SPATIAL_POSITIONS_REPOSITORY)
    private readonly repository: SpatialPositionRepository,
    private readonly mapper: SpatialPositionMapper,
    private readonly ballsService: BallsService,
    private readonly matchesService: MatchesService,
  ) {}

  async create(
    dto: CreateSpatialPositionDto,
  ): Promise<SpatialPositionResponseDto> {
    await this.assertMatchInProgress(dto.ballId);
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<SpatialPositionResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<SpatialPositionResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(
    id: number,
    dto: UpdateSpatialPositionDto,
  ): Promise<SpatialPositionResponseDto> {
    const entity = await this.getOrFail(id);
    await this.assertMatchInProgress(dto.ballId);
    const saved = await this.save(this.mapper.replaceEntity(entity, dto));
    return this.mapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.getOrFail(id);
    try {
      await this.repository.remove(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }

  // (Propuesta) Class diagram: Match (1) - Ball (1) - SpatialPosition (n). Positions
  // are only recorded while the match of the ball is in progress.
  private async assertMatchInProgress(ballId: number): Promise<void> {
    const ball = await this.ballsService.findOne(ballId);
    const match = await this.matchesService.findOne(ball.matchId);
    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El partido ${match.id} no está en curso, no se pueden registrar posiciones`,
      );
    }
  }

  private async getOrFail(id: number): Promise<SpatialPosition> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la posición espacial con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: SpatialPosition): Promise<SpatialPosition> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
