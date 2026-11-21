import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationException } from '../exception/application.exception';
import { ErrorCase } from '../exception/error-case.enum';
import { Phase } from '../phases/base/entities/phase.entity';
import { TeamsService } from '../teams/services/teams.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match, MatchStatus } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import {
  MATCH_DEPENDENCIES_CHECKER,
  type MatchDependenciesChecker,
} from './repositories/match-dependencies.port';
import { MatchesRepository } from './repositories/matches.repository';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    private readonly customMatchesRepository: MatchesRepository,
    private readonly matchMapper: MatchMapper,
    private readonly teamsService: TeamsService,
    @Inject(MATCH_DEPENDENCIES_CHECKER)
    private readonly dependenciesChecker: MatchDependenciesChecker,
  ) {}

  async create(dto: CreateMatchDto): Promise<MatchResponseDto> {
    await this.validateMatchTeams(dto.homeTeamId, dto.awayTeamId);
    const phase = await this.findPhase(dto.phaseId);
    const saved = await this.matchesRepository.save(
      this.matchMapper.toEntity(dto, phase),
    );
    return this.findOne(saved.id);
  }

  async findAll(): Promise<MatchResponseDto[]> {
    const matches = await this.matchesRepository.find({
      relations: { phase: true },
      order: { scheduledAt: 'ASC' },
    });
    return this.matchMapper.toResponseDtoList(matches);
  }

  async findOne(id: number): Promise<MatchResponseDto> {
    return this.matchMapper.toResponseDto(await this.findMatch(id));
  }

  async findByPhase(phaseId: number): Promise<MatchResponseDto[]> {
    await this.findPhase(phaseId);
    const matches = await this.matchesRepository.find({
      where: { phase: { id: phaseId } },
      order: { scheduledAt: 'ASC' },
    });
    return this.matchMapper.toResponseDtoList(matches, phaseId);
  }

  async update(id: number, dto: UpdateMatchDto): Promise<MatchResponseDto> {
    const match = await this.findMatch(id);

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `El partido #${id} está en estado ${match.status} y ya no puede modificarse`,
      );
    }

    const nextHomeTeamId =
      dto.homeTeamId !== undefined ? dto.homeTeamId : (match.homeTeamId ?? undefined);
    const nextAwayTeamId =
      dto.awayTeamId !== undefined ? dto.awayTeamId : (match.awayTeamId ?? undefined);
    await this.validateMatchTeams(nextHomeTeamId, nextAwayTeamId);

    if (dto.phaseId !== undefined) {
      match.phase = await this.findPhase(dto.phaseId);
    }

    const merged = this.matchMapper.mergeEntity(match, dto);
    this.validateResult(merged);

    const saved = await this.matchesRepository.save(merged);
    return this.matchMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const match = await this.findMatch(id);

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede eliminar el partido #${id} porque su estado es ${match.status}`,
      );
    }

    const hasScoringEvents = await this.dependenciesChecker.hasScoringEvents(id);
    if (hasScoringEvents) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede eliminar el partido #${id} porque tiene anotaciones registradas`,
      );
    }

    await this.matchesRepository.remove(match);
    return { message: `Partido #${id} eliminado correctamente` };
  }

  async updateResult(
    id: number,
    homeScore: number,
    awayScore: number,
  ): Promise<MatchResponseDto> {
    const match = await this.findMatch(id);
    if (match.status === MatchStatus.CANCELLED) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede registrar resultado en el partido #${id} porque está cancelado`,
      );
    }
    if (match.homeTeamId === null || match.awayTeamId === null) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El partido #${id} no tiene equipos participantes asignados`,
      );
    }

    match.homeScore = homeScore;
    match.awayScore = awayScore;
    const saved = await this.matchesRepository.save(match);
    return this.matchMapper.toResponseDto(saved);
  }

  async finishMatch(
    id: number,
    homeScore?: number,
    awayScore?: number,
  ): Promise<MatchResponseDto> {
    const match = await this.findMatch(id);
    if (match.status === MatchStatus.CANCELLED) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede finalizar el partido #${id} porque está cancelado`,
      );
    }
    if (match.status === MatchStatus.FINISHED) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El partido #${id} ya se encuentra finalizado`,
      );
    }
    if (match.homeTeamId === null || match.awayTeamId === null) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El partido #${id} no tiene equipos participantes asignados`,
      );
    }

    const finalHomeScore = homeScore ?? match.homeScore;
    const finalAwayScore = awayScore ?? match.awayScore;
    if (finalHomeScore === null || finalAwayScore === null) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `Para finalizar el partido #${id} se requiere registrar el marcador de ambos equipos`,
      );
    }

    match.homeScore = finalHomeScore;
    match.awayScore = finalAwayScore;
    match.status = MatchStatus.FINISHED;
    const saved = await this.matchesRepository.save(match);
    return this.matchMapper.toResponseDto(saved);
  }

  async getStatusReport(status: MatchStatus): Promise<MatchResponseDto[]> {
    return this.customMatchesRepository.findByStatusReport(status);
  }

  private async validateMatchTeams(
    homeTeamId?: number,
    awayTeamId?: number,
  ): Promise<void> {
    if (homeTeamId !== undefined) {
      await this.ensureTeamExists(homeTeamId);
    }
    if (awayTeamId !== undefined) {
      await this.ensureTeamExists(awayTeamId);
    }
    if (
      homeTeamId !== undefined &&
      awayTeamId !== undefined &&
      homeTeamId === awayTeamId
    ) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'Un equipo no puede competir contra sí mismo',
      );
    }
  }

  private async ensureTeamExists(teamId: number): Promise<void> {
    try {
      await this.teamsService.findOne(teamId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ApplicationException(
          ErrorCase.NOT_FOUND,
          `No existe un equipo con el id ${teamId}`,
        );
      }
      throw error;
    }
  }

  private async findMatch(id: number): Promise<Match> {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: { phase: true },
    });
    if (!match) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un partido con el id ${id}`,
      );
    }
    return match;
  }

  private async findPhase(id: number): Promise<Phase> {
    const phase = await this.phasesRepository.findOneBy({ id });
    if (!phase) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe una fase con el id ${id}`,
      );
    }
    return phase;
  }

  private validateResult(match: Match): void {
    if (
      match.status === MatchStatus.FINISHED &&
      (match.homeScore === null || match.awayScore === null)
    ) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'Un partido finalizado requiere registrar ambos marcadores',
      );
    }
  }
}
