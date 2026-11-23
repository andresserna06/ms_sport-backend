import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreateVenueDto } from '../dtos/create-venue.dto';
import { VenueResponseDto } from '../dtos/venue-response.dto';
import { UpdateVenueDto } from '../dtos/update-venue.dto';
import { Venue } from '../entities/venue.entity';
import { VenueMapper } from '../mappers/venue.mapper';
import {
  VENUES_REPOSITORY,
  type VenueRepository,
} from '../repositories/venue.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'el escenario',
  duplicate: 'Ya existe el escenario con esos datos',
  references: {
    FK_venues_parent_venue: 'el escenario padre',
  },
};

@Injectable()
export class VenuesService {
  constructor(
    @Inject(VENUES_REPOSITORY) private readonly repository: VenueRepository,
    private readonly mapper: VenueMapper,
  ) {}

  async create(dto: CreateVenueDto): Promise<VenueResponseDto> {
    await this.assertValidParent(dto.parentVenueId, undefined, undefined);
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<VenueResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<VenueResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(id: number, dto: UpdateVenueDto): Promise<VenueResponseDto> {
    const entity = await this.getOrFail(id);
    await this.assertValidParent(
      dto.parentVenueId,
      id,
      entity.parentVenueId,
    );
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

  // (Propuesta) Same rule as Sport: a venue cannot be its own parent nor create a
  // cycle (A parent of B and B parent of A) -> 400. A new parent must be active.
  private async assertValidParent(
    parentVenueId: number | undefined | null,
    venueId: number | undefined,
    currentParentId: number | null | undefined,
  ): Promise<void> {
    if (parentVenueId === undefined || parentVenueId === null) return;
    if (venueId !== undefined && parentVenueId === venueId) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'Un escenario no puede ser su propio escenario padre',
      );
    }
    const parent = await this.repository.findById(parentVenueId);
    if (!parent) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el escenario padre con id ${parentVenueId}`,
      );
    }
    if (parentVenueId !== currentParentId && !parent.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El escenario padre ${parentVenueId} está inactivo`,
      );
    }
    let ancestorId = parent.parentVenueId;
    const visited = new Set<number>();
    while (venueId !== undefined && ancestorId !== null) {
      if (ancestorId === venueId) {
        throw new ApplicationException(
          ErrorCase.INVALID_OPERATION,
          'El escenario padre indicado genera un ciclo en la jerarquía de escenarios',
        );
      }
      if (visited.has(ancestorId)) break;
      visited.add(ancestorId);
      const ancestor = await this.repository.findById(ancestorId);
      ancestorId = ancestor ? ancestor.parentVenueId : null;
    }
  }

  private async getOrFail(id: number): Promise<Venue> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el escenario con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: Venue): Promise<Venue> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
