import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTeamDto } from '../dtos/create-team.dto';
import { TeamResponseDto } from '../dtos/team-response.dto';
import { UpdateTeamDto } from '../dtos/update-team.dto';
import { Team } from '../entities/team.entity';
import { TeamMapper } from '../mappers/team.mapper';
import {
  TEAM_REPOSITORY,
  TeamInUseError,
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

    const saved = await this.repository.save(entity);
    return this.teamMapper.toResponseDto(saved);
  }

  async findAll(active?: boolean): Promise<TeamResponseDto[]> {
    const teams = await this.repository.findAll(active);
    return this.teamMapper.toResponseDtoList(teams);
  }

  async findOneEntity(id: number): Promise<Team | null> {
    return this.teamsRepository.findOne({ where: { id } });
  }

  async findOne(id: number): Promise<TeamResponseDto> {
    const team = await this.getTeamOrFail(id);
    return this.teamMapper.toResponseDto(team);
  }

  async update(id: number, dto: UpdateTeamDto): Promise<TeamResponseDto> {
    const team = await this.getTeamOrFail(id);
    const merged = this.teamMapper.mergeEntity(team, dto);

    if (dto.name !== undefined) {
      await this.ensureNameIsAvailable(merged.name, id);
    }

    const saved = await this.repository.save(merged);
    return this.teamMapper.toResponseDto(saved);
  }

  async deactivate(id: number): Promise<TeamResponseDto> {
    return this.changeStatus(id, false);
  }

  async activate(id: number): Promise<TeamResponseDto> {
    return this.changeStatus(id, true);
  }

  async remove(id: number): Promise<{ message: string }> {
    const team = await this.getTeamOrFail(id);

    const associations = await this.repository.countAssociations(id);
    if (associations > 0) {
      throw new ConflictException(
        `Team #${id} has associated information (${associations} records) and cannot be deleted. Deactivate it instead.`,
      );
    }

    try {
      await this.repository.remove(team);
    } catch (error) {
      // Something started referencing the team after the association count.
      if (error instanceof TeamInUseError) {
        throw new ConflictException(
          `Team #${id} has associated information and cannot be deleted. Deactivate it instead.`,
        );
      }
      throw error;
    }
    return { message: `Team #${id} deleted successfully` };
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
      throw new NotFoundException(`Team with id ${id} not found`);
    }
    return team;
  }

  private async ensureNameIsAvailable(
    name: string,
    ignoreId?: number,
  ): Promise<void> {
    const existing = await this.repository.findByName(name);
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException(`A team named "${name}" already exists`);
    }
  }
}
