import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreateFanTeamDto } from '../dtos/create-fan-team.dto';
import { FanTeamResponseDto } from '../dtos/fan-team-response.dto';
import { UpdateFanTeamDto } from '../dtos/update-fan-team.dto';
import { FanTeam } from '../entities/fan-team.entity';
import { FanTeamMapper } from '../mappers/fan-team.mapper';
import {
  FAN_TEAMS_REPOSITORY,
  type FanTeamRepository,
} from '../repositories/fan-team.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'la relación del aficionado con el equipo',
  duplicate: 'El aficionado ya sigue a ese equipo',
  references: {
    FK_fan_teams_fan: 'el aficionado',
    FK_fan_teams_team: 'el equipo',
  },
};

@Injectable()
export class FanTeamsService {
  constructor(
    @Inject(FAN_TEAMS_REPOSITORY)
    private readonly repository: FanTeamRepository,
    private readonly mapper: FanTeamMapper,
  ) {}

  async create(dto: CreateFanTeamDto): Promise<FanTeamResponseDto> {
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<FanTeamResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<FanTeamResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(id: number, dto: UpdateFanTeamDto): Promise<FanTeamResponseDto> {
    const entity = await this.getOrFail(id);
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

  private async getOrFail(id: number): Promise<FanTeam> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la relación del aficionado con el equipo con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: FanTeam): Promise<FanTeam> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
