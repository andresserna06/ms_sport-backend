import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PhasesService } from '../base/phases.service';
import { RegistrationsService } from '../../registrations/registrations.service';
import { TournamentsService } from '../../tournaments/tournaments.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { GroupTeamResponseDto } from './dto/group-team-response.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';
import { GroupMapper } from './mappers/group.mapper';
import { GROUP_REPOSITORY } from './repositories/group.repository';
import type { GroupRepository } from './repositories/group.repository';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';

@Injectable()
export class GroupService {
  constructor(
    @Inject(GROUP_REPOSITORY)
    private readonly groupRepository: GroupRepository,
    private readonly groupMapper: GroupMapper,
    private readonly phasesService: PhasesService,
    private readonly tournamentsService: TournamentsService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  async create(dto: CreateGroupDto): Promise<GroupResponseDto> {
    await this.getTournamentOrFail(dto.tournamentId);

    if (
      await this.phasesService.existsByNameInTournament(
        dto.name,
        dto.tournamentId,
      )
    ) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una fase con el nombre "${dto.name}" en el torneo ${dto.tournamentId}`,
      );
    }

    const entity = this.groupMapper.toEntity(dto, dto.tournamentId);
    const saved = await this.groupRepository.save(entity);
    return this.groupMapper.toResponseDto(saved);
  }

  async findAll(tournamentId?: number): Promise<GroupResponseDto[]> {
    const groups = await this.groupRepository.findAll(tournamentId);
    return this.groupMapper.toResponseDtoList(groups);
  }

  async findOne(id: number): Promise<GroupResponseDto> {
    const group = await this.getGroupOrFail(id);
    return this.groupMapper.toResponseDto(group);
  }

  async update(id: number, dto: UpdateGroupDto): Promise<GroupResponseDto> {
    const group = await this.getGroupOrFail(id);
    const tournamentId = group.tournament?.id;

    if (
      dto.name !== undefined &&
      tournamentId !== undefined &&
      (await this.phasesService.existsByNameInTournament(
        dto.name,
        tournamentId,
        id,
      ))
    ) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una fase con el nombre "${dto.name}" en el torneo ${tournamentId}`,
      );
    }

    const merged = this.groupMapper.mergeEntity(group, dto);
    const saved = await this.groupRepository.save(merged);
    return this.groupMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const group = await this.getGroupOrFail(id);

    if (await this.phasesService.hasMatches(id)) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El grupo #${id} tiene partidos y no se puede eliminar`,
      );
    }

    await this.groupRepository.remove(group);
    return { message: `Grupo #${id} eliminado correctamente` };
  }

  async assignTeam(
    groupId: number,
    teamId: number,
  ): Promise<GroupResponseDto> {
    const group = await this.getGroupOrFail(groupId);
    const team = await this.groupRepository.findTeamById(teamId);

    if (!team) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un equipo con el id ${teamId}`,
      );
    }

    if (!team.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo #${teamId} está inactivo y no se puede asignar a un grupo`,
      );
    }

    if (team.group?.id === groupId) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `El equipo #${teamId} ya pertenece al grupo #${groupId}`,
      );
    }

    if (team.group) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo #${teamId} ya pertenece al grupo #${team.group.id}; ret��relo antes de asignarlo a otro grupo`,
      );
    }

    const tournamentId = group.tournament?.id;
    if (tournamentId == null) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El grupo #${groupId} no tiene un torneo asociado`,
      );
    }
    await this.registrationsService.assertTeamRegisteredInTournament(
      teamId,
      tournamentId,
    );

    team.group = group;
    await this.groupRepository.saveTeam(team);
    return this.findOne(groupId);
  }

  async removeTeam(groupId: number, teamId: number): Promise<void> {
    await this.getGroupOrFail(groupId);
    const team = await this.groupRepository.findTeamById(teamId);

    if (!team) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un equipo con el id ${teamId}`,
      );
    }

    if (team.group?.id !== groupId) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo #${teamId} no pertenece al grupo #${groupId}`,
      );
    }

    team.group = null;
    await this.groupRepository.saveTeam(team);
  }

  async isTeamInGroup(teamId: number, tournamentId: number): Promise<boolean> {
    const team = await this.groupRepository.findTeamById(teamId);
    return team?.group?.tournament?.id === tournamentId;
  }

  async assertTeamBelongsToGroup(teamId: number, groupId: number): Promise<void> {
    const team = await this.groupRepository.findTeamById(teamId);
    if (!team) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un equipo con el id ${teamId}`,
      );
    }
    if (team.group?.id !== groupId) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo ${teamId} no pertenece al grupo ${groupId}`,
      );
    }
  }

  async findTeams(groupId: number): Promise<GroupTeamResponseDto[]> {
    await this.getGroupOrFail(groupId);
    const teams = await this.groupRepository.findTeams(groupId);
    return this.groupMapper.toTeamResponseDtoList(teams);
  }

  private async getGroupOrFail(id: number): Promise<Group> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un grupo con el id ${id}`,
      );
    }
    return group;
  }

  private async getTournamentOrFail(id: number): Promise<void> {
    try {
      await this.tournamentsService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ApplicationException(
          ErrorCase.NOT_FOUND,
          `No existe un torneo con el id ${id}`,
        );
      }
      throw error;
    }
  }
}
