import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreateSportDto } from '../dtos/create-sport.dto';
import { SportResponseDto } from '../dtos/sport-response.dto';
import { UpdateSportDto } from '../dtos/update-sport.dto';
import { Sport } from '../entities/sport.entity';
import { SportMapper } from '../mappers/sport.mapper';
import {
  DuplicateSportNameError,
  ParentSportNotFoundError,
  SPORT_REPOSITORY,
  SportInUseError,
  type SportDependencies,
  type SportRepository,
} from '../repositories/sport.repository';

export interface FindSportsParams {
  active?: boolean;
  all?: boolean;
  name?: string;
  parentSportId?: number;
}

@Injectable()
export class SportsService {
  constructor(
    @Inject(SPORT_REPOSITORY) private readonly repository: SportRepository,
    private readonly mapper: SportMapper,
  ) {}

  async create(dto: CreateSportDto): Promise<SportResponseDto> {
    const entity = this.mapper.toEntity(dto);

    await this.validateParent(entity.parentSportId);
    await this.ensureNameIsAvailable(entity.name);

    const saved = await this.save(entity);
    return this.getDetailOrFail(saved.id);
  }

  // By default only active sports are returned. `all` returns every sport
  // and `active=false` returns only the inactive ones.
  async findAll(params: FindSportsParams = {}): Promise<SportResponseDto[]> {
    const sports = await this.repository.findAll({
      active: params.all ? undefined : (params.active ?? true),
      name: params.name?.trim() || undefined,
      parentSportId: params.parentSportId,
    });
    return this.mapper.toResponseDtoList(sports);
  }

  findOne(id: number): Promise<SportResponseDto> {
    return this.getDetailOrFail(id);
  }

  // Same state rule as the main list: active sub-sports by default.
  async findSubSports(
    id: number,
    params: Pick<FindSportsParams, 'active' | 'all'> = {},
  ): Promise<SportResponseDto[]> {
    await this.getSportOrFail(id);
    const subSports = await this.repository.findSubSports(
      id,
      params.all ? undefined : (params.active ?? true),
    );
    return this.mapper.toResponseDtoList(subSports);
  }

  async update(id: number, dto: UpdateSportDto): Promise<SportResponseDto> {
    const sport = await this.getSportOrFail(id);
    const previousParentId = sport.parentSportId;
    const merged = this.mapper.mergeEntity(sport, dto);

    await this.validateParent(merged.parentSportId, id, previousParentId);
    await this.ensureNameIsAvailable(merged.name, id);

    await this.save(merged);
    return this.getDetailOrFail(id);
  }

  async deactivate(id: number): Promise<SportResponseDto> {
    const sport = await this.getSportOrFail(id);

    if (sport.active) {
      const { activeSubSports } = await this.repository.countDependencies(id);
      if (activeSubSports > 0) {
        throw new ApplicationException(
          ErrorCase.INVALID_STATE,
          `No se puede desactivar el deporte "${sport.name}": tiene ${activeSubSports} ${this.plural(activeSubSports, 'subdeporte activo', 'subdeportes activos')}. Desactive primero sus subdeportes.`,
        );
      }
      sport.active = false;
      await this.save(sport);
    }

    return this.getDetailOrFail(id);
  }

  async activate(id: number): Promise<SportResponseDto> {
    const sport = await this.getSportOrFail(id);

    if (!sport.active) {
      if (sport.parentSportId !== null) {
        const parent = await this.repository.findById(sport.parentSportId);
        if (parent && !parent.active) {
          throw new ApplicationException(
            ErrorCase.INVALID_STATE,
            `No se puede activar el deporte "${sport.name}": su deporte padre "${parent.name}" está inactivo. Active primero el deporte padre.`,
          );
        }
      }
      sport.active = true;
      await this.save(sport);
    }

    return this.getDetailOrFail(id);
  }

  async remove(id: number): Promise<void> {
    const sport = await this.getSportOrFail(id);
    const dependencies = await this.repository.countDependencies(id);
    const blockers = this.describeBlockers(dependencies);

    if (blockers.length > 0) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede eliminar el deporte "${sport.name}": tiene ${blockers.join(', ')}. Desactívelo en su lugar.`,
      );
    }

    try {
      await this.repository.remove(sport);
    } catch (error) {
      // Something started referencing the sport after the dependency count.
      if (error instanceof SportInUseError) {
        throw new ApplicationException(
          ErrorCase.INVALID_STATE,
          `No se puede eliminar el deporte "${sport.name}": acaba de recibir información asociada. Desactívelo en su lugar.`,
        );
      }
      throw error;
    }
  }

  private async getSportOrFail(id: number): Promise<Sport> {
    const sport = await this.repository.findById(id);
    if (!sport) throw this.notFound(id);
    return sport;
  }

  // The response is always built from what is stored in the database.
  private async getDetailOrFail(id: number): Promise<SportResponseDto> {
    const sport = await this.repository.findDetail(id);
    if (!sport) throw this.notFound(id);
    return this.mapper.toResponseDto(sport);
  }

  private notFound(id: number): ApplicationException {
    return new ApplicationException(
      ErrorCase.NOT_FOUND,
      `No existe el deporte con id ${id}`,
    );
  }

  // Hierarchy rules: a single level of sub-sports.
  // Known limitation: the checks and the save are not atomic. Two simultaneous
  // writes (e.g. adding a child to a sport while that sport is moved under
  // another one) could create a second level; closing it would need row locks.
  // `sportId` is only present on update; `currentParentId` is the parent the
  // sport had before the update (an inactive parent is only rejected if it is new).
  private async validateParent(
    parentSportId: number | null,
    sportId?: number,
    currentParentId?: number | null,
  ): Promise<void> {
    if (parentSportId === null) return;

    if (sportId !== undefined && parentSportId === sportId) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'Un deporte no puede ser su propio deporte padre',
      );
    }

    const parent = await this.repository.findById(parentSportId);
    if (!parent) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el deporte padre con id ${parentSportId}`,
      );
    }

    if (parent.parentSportId !== null) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El deporte "${parent.name}" ya es un subdeporte y no puede tener subdeportes`,
      );
    }

    if (sportId !== undefined) {
      const { subSports } = await this.repository.countDependencies(sportId);
      if (subSports > 0) {
        throw new ApplicationException(
          ErrorCase.INVALID_OPERATION,
          'Un deporte que tiene subdeportes no puede convertirse en subdeporte',
        );
      }
    }

    if (!parent.active && parentSportId !== currentParentId) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El deporte padre "${parent.name}" está inactivo`,
      );
    }
  }

  private async ensureNameIsAvailable(
    name: string,
    ignoreId?: number,
  ): Promise<void> {
    if (await this.repository.existsByName(name, ignoreId)) {
      throw this.duplicateNameError(name);
    }
  }

  // Two concurrent requests with the same name: the second one hits the
  // UNIQUE index and must answer 409, not 500.
  private async save(entity: Sport): Promise<Sport> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      if (error instanceof DuplicateSportNameError) {
        throw this.duplicateNameError(entity.name);
      }
      if (error instanceof ParentSportNotFoundError) {
        throw new ApplicationException(
          ErrorCase.NOT_FOUND,
          `No existe el deporte padre con id ${entity.parentSportId}`,
        );
      }
      throw error;
    }
  }

  private duplicateNameError(name: string): ApplicationException {
    return new ApplicationException(
      ErrorCase.ALREADY_EXISTS,
      `Ya existe un deporte con el nombre ${name}`,
    );
  }

  private describeBlockers(dependencies: SportDependencies): string[] {
    const blockers: string[] = [];
    const { subSports, teams, tournaments } = dependencies;

    if (subSports > 0) {
      blockers.push(
        `${subSports} ${this.plural(subSports, 'subdeporte', 'subdeportes')}`,
      );
    }
    if (teams > 0) {
      blockers.push(
        `${teams} ${this.plural(teams, 'equipo asociado', 'equipos asociados')}`,
      );
    }
    if (tournaments > 0) {
      blockers.push(
        `${tournaments} ${this.plural(tournaments, 'torneo', 'torneos')}`,
      );
    }
    return blockers;
  }

  private plural(count: number, singular: string, pluralForm: string): string {
    return count === 1 ? singular : pluralForm;
  }
}
