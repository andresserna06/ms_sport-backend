import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreateTeamDto } from '../dtos/create-team.dto';
import { TeamResponseDto } from '../dtos/team-response.dto';
import { UpdateTeamDto } from '../dtos/update-team.dto';
import { Team } from '../entities/team.entity';
import { TeamMapper } from '../mappers/team.mapper';
import {
  DuplicateTeamNameError,
  TEAM_REPOSITORY,
  TeamInUseError,
  type TeamAssociations,
  type TeamCityReportRow,
  type TeamRepository,
} from '../repositories/team.repository';

@Injectable()
export class TeamsService {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repository: TeamRepository,
    private readonly teamMapper: TeamMapper,
  ) {}

  async create(dto: CreateTeamDto): Promise<TeamResponseDto> {
    const entity = this.teamMapper.toEntity(dto);
    await this.ensureNameIsAvailable(entity.name);

    const saved = await this.save(entity);
    return this.teamMapper.toResponseDto(saved);
  }

  async findAll(active?: boolean): Promise<TeamResponseDto[]> {
    const teams = await this.repository.findAll(active);
    return this.teamMapper.toResponseDtoList(teams);
  }

  async findOneEntity(id: number): Promise<Team | null> {
    return this.repository.findById(id);
  }

  async findOne(id: number): Promise<TeamResponseDto> {
    const team = await this.getTeamOrFail(id);
    return this.teamMapper.toResponseDto(team);
  }

  async update(id: number, dto: UpdateTeamDto): Promise<TeamResponseDto> {
    const team = await this.getTeamOrFail(id);
    const replaced = this.teamMapper.replaceEntity(team, dto);
    await this.ensureNameIsAvailable(replaced.name, id);

    const saved = await this.save(replaced);
    return this.teamMapper.toResponseDto(saved);
  }

  async deactivate(id: number): Promise<TeamResponseDto> {
    return this.changeStatus(id, false);
  }

  async activate(id: number): Promise<TeamResponseDto> {
    return this.changeStatus(id, true);
  }

  async remove(id: number): Promise<void> {
    const team = await this.getTeamOrFail(id);

    const blockers = this.describeAssociations(
      await this.repository.countAssociations(id),
    );
    if (blockers.length > 0) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede eliminar el equipo "${team.name}": tiene ${blockers.join(', ')}. Desactívelo en su lugar.`,
      );
    }

    try {
      await this.repository.remove(team);
    } catch (error) {
      // Something started referencing the team after the association count.
      if (error instanceof TeamInUseError) {
        throw new ApplicationException(
          ErrorCase.INVALID_STATE,
          `No se puede eliminar el equipo "${team.name}": acaba de recibir información asociada. Desactívelo en su lugar.`,
        );
      }
      throw error;
    }
  }

  async getActiveByCityReport(): Promise<TeamCityReportRow[]> {
    return this.repository.findActiveByCityReport();
  }

  private async changeStatus(
    id: number,
    active: boolean,
  ): Promise<TeamResponseDto> {
    const team = await this.getTeamOrFail(id);
    team.active = active;
    const saved = await this.repository.save(team);
    return this.teamMapper.toResponseDto(saved);
  }

  private async getTeamOrFail(id: number): Promise<Team> {
    const team = await this.repository.findById(id);
    if (!team) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un equipo con el id ${id}`,
      );
    }
    return team;
  }

  private async ensureNameIsAvailable(
    name: string,
    ignoreId?: number,
  ): Promise<void> {
    const existing = await this.repository.findByName(name);
    if (existing && existing.id !== ignoreId) {
      throw this.duplicateName(name);
    }
  }

  // The name check above is not atomic; the UNIQUE index decides when two
  // requests race, and the repository reports it as DuplicateTeamNameError.
  private async save(team: Team): Promise<Team> {
    try {
      return await this.repository.save(team);
    } catch (error) {
      if (error instanceof DuplicateTeamNameError) {
        throw this.duplicateName(team.name);
      }
      throw error;
    }
  }

  private duplicateName(name: string): ApplicationException {
    return new ApplicationException(
      ErrorCase.ALREADY_EXISTS,
      `Ya existe un equipo con el nombre "${name}"`,
    );
  }

  private describeAssociations(associations: TeamAssociations): string[] {
    const parts: [number, string, string][] = [
      [associations.sports, 'deporte asociado', 'deportes asociados'],
      [associations.contracts, 'contrato', 'contratos'],
      [associations.matches, 'partido', 'partidos'],
      [associations.scoringEvents, 'anotación', 'anotaciones'],
    ];
    return parts
      .filter(([total]) => total > 0)
      .map(([total, one, many]) => `${total} ${total === 1 ? one : many}`);
  }
}
