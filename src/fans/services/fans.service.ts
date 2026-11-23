import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreateFanDto } from '../dtos/create-fan.dto';
import { FanResponseDto } from '../dtos/fan-response.dto';
import { UpdateFanDto } from '../dtos/update-fan.dto';
import { Fan } from '../entities/fan.entity';
import { FanMapper } from '../mappers/fan.mapper';
import {
  FAN_ROLE_ASSIGNER,
  type FanRoleAssigner,
} from '../ports/fan-role-assigner.port';
import {
  FANS_REPOSITORY,
  type FanRepository,
} from '../repositories/fan.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'el aficionado',
  duplicate: 'Ya existe un aficionado asociado a ese usuario',
  references: {},
};

@Injectable()
export class FansService {
  constructor(
    @Inject(FANS_REPOSITORY) private readonly repository: FanRepository,
    @Inject(FAN_ROLE_ASSIGNER)
    private readonly fanRoleAssigner: FanRoleAssigner,
    private readonly mapper: FanMapper,
  ) {}

  async create(
    dto: CreateFanDto,
    authorizationHeader?: string,
  ): Promise<FanResponseDto> {
    const roleId =
      await this.fanRoleAssigner.resolveFanRoleId(authorizationHeader);
    const saved = await this.save(this.mapper.toEntity(dto));
    await this.fanRoleAssigner.assignFanRole(
      saved.userId,
      authorizationHeader,
      roleId,
    );
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<FanResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<FanResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(id: number, dto: UpdateFanDto): Promise<FanResponseDto> {
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

  private async getOrFail(id: number): Promise<Fan> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el aficionado con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: Fan): Promise<Fan> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
