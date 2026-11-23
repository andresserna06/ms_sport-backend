import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreateSeatingZoneDto } from '../dtos/create-seating-zone.dto';
import { SeatingZoneResponseDto } from '../dtos/seating-zone-response.dto';
import { UpdateSeatingZoneDto } from '../dtos/update-seating-zone.dto';
import { SeatingZone } from '../entities/seating-zone.entity';
import { SeatingZoneMapper } from '../mappers/seating-zone.mapper';
import {
  SEATING_ZONES_REPOSITORY,
  type SeatingZoneRepository,
} from '../repositories/seating-zone.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'la localidad',
  duplicate: 'Ya existe una localidad con ese nombre en el escenario',
  references: {
    FK_seating_zones_venue: 'el escenario',
  },
};

@Injectable()
export class SeatingZonesService {
  constructor(
    @Inject(SEATING_ZONES_REPOSITORY)
    private readonly repository: SeatingZoneRepository,
    private readonly mapper: SeatingZoneMapper,
  ) {}

  async create(dto: CreateSeatingZoneDto): Promise<SeatingZoneResponseDto> {
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<SeatingZoneResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<SeatingZoneResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(
    id: number,
    dto: UpdateSeatingZoneDto,
  ): Promise<SeatingZoneResponseDto> {
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

  private async getOrFail(id: number): Promise<SeatingZone> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la localidad con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: SeatingZone): Promise<SeatingZone> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
