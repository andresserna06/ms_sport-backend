import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from './entities/team.entity';
import { TeamMapper } from './mappers/team.mapper';
import { TeamsRepository } from './repositories/teams.repository';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    private readonly customTeamsRepository: TeamsRepository,
    private readonly teamMapper: TeamMapper,
  ) {}

  async create(dto: CreateTeamDto): Promise<TeamResponseDto> {
    const entity = this.teamMapper.toEntity(dto);
    await this.ensureNameIsAvailable(entity.name);

    const saved = await this.teamsRepository.save(entity);
    return this.teamMapper.toResponseDto(saved);
  }

  async findAll(active?: boolean): Promise<TeamResponseDto[]> {
    const teams = await this.teamsRepository.find({
      where: active === undefined ? {} : { active },
      order: { name: 'ASC' },
    });
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

    const saved = await this.teamsRepository.save(merged);
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

    const associations = await this.customTeamsRepository.countAssociations(id);
    if (associations > 0) {
      throw new ConflictException(
        `Team #${id} has associated information (${associations} records) and cannot be deleted. Deactivate it instead.`,
      );
    }

    await this.teamsRepository.remove(team);
    return { message: `Team #${id} deleted successfully` };
  }

  async getActiveByCityReport(): Promise<
    { city: string; totalTeams: number }[]
  > {
    return this.customTeamsRepository.findActiveByCityReport();
  }

  private async changeStatus(
    id: number,
    active: boolean,
  ): Promise<TeamResponseDto> {
    const team = await this.getTeamOrFail(id);
    team.active = active;
    const saved = await this.teamsRepository.save(team);
    return this.teamMapper.toResponseDto(saved);
  }

  private async getTeamOrFail(id: number): Promise<Team> {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }
    return team;
  }

  private async ensureNameIsAvailable(
    name: string,
    ignoreId?: number,
  ): Promise<void> {
    const existing = await this.teamsRepository.findOne({ where: { name } });
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException(`A team named "${name}" already exists`);
    }
  }
}
