import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationException } from '../exception/application.exception';
import { ErrorCase } from '../exception/error-case.enum';
import { MATCH_NOTIFIER, type MatchNotifier } from '../notifications/ports/match-notifier.port';
import { Phase } from '../phases/base/entities/phase.entity';
import { PhasesService } from '../phases/base/phases.service';
import { GroupService } from '../phases/group/group.service';
import { RegistrationsService } from '../registrations/registrations.service';
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
import { MATCH_REPOSITORY, type MatchRepository } from './repositories/matches.repository';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(
    @Inject(MATCH_REPOSITORY)
    private readonly matchesRepository: MatchRepository,
    private readonly phasesService: PhasesService,
    private readonly groupService: GroupService,
    private readonly registrationsService: RegistrationsService,
    private readonly teamsService: TeamsService,
    private readonly matchMapper: MatchMapper,
    @Inject(MATCH_DEPENDENCIES_CHECKER)
    private readonly dependenciesChecker: MatchDependenciesChecker,
    @Inject(MATCH_NOTIFIER)
    private readonly matchNotifier: MatchNotifier,
  ) {}

  async create(phaseId: number, dto: CreateMatchDto): Promise<MatchResponseDto> {
    const phase = await this.getPhaseOrFail(phaseId);
    this.assertScheduledAtAfterTournamentStart(phase, dto.scheduledAt);
    await this.validateTeamsForPhase(phase, dto.homeTeamId, dto.awayTeamId);
    const saved = await this.matchesRepository.save(this.matchMapper.toEntity(dto, phase));
    const created = await this.findOne(saved.id);
    await this.notifyMatchCreated(created, phase.id);
    return created;
  }

  async findAll(filters?: { tournamentId?: number; phaseId?: number }): Promise<MatchResponseDto[]> {
    return this.matchMapper.toResponseDtoList(await this.matchesRepository.findAll(filters));
  }

  async findOne(id: number): Promise<MatchResponseDto> {
    return this.matchMapper.toResponseDto(await this.getMatchOrFail(id));
  }

  async findByPhase(phaseId: number): Promise<MatchResponseDto[]> {
    await this.getPhaseOrFail(phaseId);
    return this.matchMapper.toResponseDtoList(await this.matchesRepository.findByPhase(phaseId), phaseId);
  }

  async update(id: number, dto: UpdateMatchDto): Promise<MatchResponseDto> {
    const match = await this.getMatchOrFail(id);
    if (match.status !== MatchStatus.SCHEDULED) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El partido ${id} no se puede modificar porque su estado es ${match.status}`,
      );
    }

    const targetPhase =
      dto.phaseId !== undefined ? await this.getPhaseOrFail(dto.phaseId) : match.phase;
    const currentTournamentId = match.phase?.tournament?.id;
    const targetTournamentId = targetPhase.tournament?.id;
    if (
      currentTournamentId !== undefined &&
      targetTournamentId !== undefined &&
      currentTournamentId !== targetTournamentId
    ) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede mover el partido ${id} a una fase de otro torneo`,
      );
    }

    const homeTeamId =
      dto.homeTeamId !== undefined ? dto.homeTeamId : (match.homeTeamId ?? undefined);
    const awayTeamId =
      dto.awayTeamId !== undefined ? dto.awayTeamId : (match.awayTeamId ?? undefined);
    await this.validateTeamsForPhase(targetPhase, homeTeamId, awayTeamId);

    if (dto.phaseId !== undefined) match.phase = targetPhase;
    const saved = await this.matchesRepository.save(this.matchMapper.mergeEntity(match, dto));
    return this.matchMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const match = await this.getMatchOrFail(id);
    if (match.status !== MatchStatus.SCHEDULED) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede eliminar el partido ${id} porque su estado es ${match.status}`,
      );
    }
    const hasBlockingDependencies =
      (await this.dependenciesChecker.hasBlockingDependencies?.(id)) ??
      (await this.dependenciesChecker.hasScoringEvents(id));
    if (hasBlockingDependencies) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede eliminar el partido ${id} porque tiene información asociada que lo impide`,
      );
    }
    await this.matchesRepository.remove(match);
  }

  async updateResult(id: number, homeScore: number, awayScore: number): Promise<MatchResponseDto> {
    const match = await this.getMatchOrFail(id);
    this.assertMatchNotCancelled(match, 'registrar resultado');
    this.assertTeamsAssigned(match);
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    return this.matchMapper.toResponseDto(await this.matchesRepository.save(match));
  }

  async finishMatch(id: number, homeScore?: number, awayScore?: number): Promise<MatchResponseDto> {
    const match = await this.getMatchOrFail(id);
    if (match.status === MatchStatus.CANCELLED) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, `No se puede finalizar el partido ${id} porque est? cancelado`);
    }
    if (match.status === MatchStatus.FINISHED) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, `El partido ${id} ya se encuentra finalizado`);
    }
    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, `Solo se puede finalizar un partido en estado IN_PROGRESS`);
    }
    this.assertTeamsAssigned(match);
    const finalHomeScore = homeScore ?? match.homeScore;
    const finalAwayScore = awayScore ?? match.awayScore;
    if (finalHomeScore === null || finalAwayScore === null) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, `Para finalizar el partido ${id} se requiere registrar el marcador de ambos equipos`);
    }
    match.homeScore = finalHomeScore;
    match.awayScore = finalAwayScore;
    match.status = MatchStatus.FINISHED;
    return this.matchMapper.toResponseDto(await this.matchesRepository.save(match));
  }

  async startMatch(id: number): Promise<MatchResponseDto> {
    const match = await this.getMatchOrFail(id);
    if (match.status !== MatchStatus.SCHEDULED) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, 'Solo se puede iniciar un partido en estado SCHEDULED');
    }
    this.assertTeamsAssigned(match);
    match.status = MatchStatus.IN_PROGRESS;
    return this.matchMapper.toResponseDto(await this.matchesRepository.save(match));
  }

  async cancelMatch(id: number): Promise<MatchResponseDto> {
    const match = await this.getMatchOrFail(id);
    if (![MatchStatus.SCHEDULED, MatchStatus.IN_PROGRESS].includes(match.status)) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, `No se puede cancelar el partido ${id} desde el estado ${match.status}`);
    }
    match.status = MatchStatus.CANCELLED;
    return this.matchMapper.toResponseDto(await this.matchesRepository.save(match));
  }

  private async getMatchOrFail(id: number): Promise<Match> {
    const match = await this.matchesRepository.findById(id);
    if (!match) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe un partido con el id ${id}`);
    return match;
  }

  private async getPhaseOrFail(id: number): Promise<Phase> {
    const phase = await this.phasesService.findOneEntity(id);
    if (!phase) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe una fase con el id ${id}`);
    if (!phase.tournament?.id) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, `La fase ${id} no tiene un torneo asociado`);
    }
    return phase;
  }

  private async validateTeamsForPhase(phase: Phase, homeTeamId?: number, awayTeamId?: number): Promise<void> {
    const isGroup = phase.phaseType === 'GROUP';
    if (isGroup && (homeTeamId === undefined || awayTeamId === undefined)) {
      throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'Los partidos de fase de grupos requieren equipo local y visitante');
    }
    if (homeTeamId === undefined && awayTeamId === undefined) return;
    if (homeTeamId !== undefined && awayTeamId !== undefined && homeTeamId === awayTeamId) {
      throw new ApplicationException(ErrorCase.INVALID_OPERATION, 'Un equipo no puede competir contra sí mismo');
    }
    const tournamentId = phase.tournament!.id;
    for (const [label, teamId] of [['local', homeTeamId], ['visitante', awayTeamId]] as const) {
      if (teamId === undefined) continue;
      await this.assertTeamCanParticipate(teamId, tournamentId, phase, label);
    }
  }

  private async assertTeamCanParticipate(teamId: number, tournamentId: number, phase: Phase, label: 'local' | 'visitante'): Promise<void> {
    const team = await this.teamsService.findOneEntity(teamId);
    if (!team) throw new ApplicationException(ErrorCase.NOT_FOUND, `No existe un equipo con el id ${teamId}`);
    if (!team.active) throw new ApplicationException(ErrorCase.INVALID_STATE, `El equipo ${label} ${teamId} está inactivo`);
    await this.registrationsService.assertTeamRegisteredInTournament(teamId, tournamentId);
    if (phase.phaseType === 'GROUP') {
      await this.groupService.assertTeamBelongsToGroup(teamId, phase.id);
    }
  }

  private assertMatchNotCancelled(match: Match, action: string): void {
    if (match.status === MatchStatus.CANCELLED) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, `No se puede ${action} en el partido ${match.id} porque está cancelado`);
    }
  }

  private assertTeamsAssigned(match: Match): void {
    if (match.homeTeamId === null || match.awayTeamId === null) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El partido ${match.id} no tiene equipos participantes asignados`,
      );
    }
  }

  private assertScheduledAtAfterTournamentStart(phase: Phase, scheduledAt: string): void {
    const tournamentStart = phase.tournament?.startDate;
    if (!tournamentStart) return;
    const matchDate = String(scheduledAt).slice(0, 10);
    if (matchDate < tournamentStart) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `La fecha del partido no puede ser anterior al inicio del torneo (${tournamentStart})`,
      );
    }
  }

  private async notifyMatchCreated(match: MatchResponseDto, phaseId: number): Promise<void> {
    try {
      await this.matchNotifier.notifyMatchCreated({
        matchId: match.id,
        phaseId,
        homeTeamName: match.homeTeamId ? `Equipo ${match.homeTeamId}` : undefined,
        awayTeamName: match.awayTeamId ? `Equipo ${match.awayTeamId}` : undefined,
        scheduledAt: new Date(match.scheduledAt).toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo enviar la notificación de creación del partido #${match.id}: ${String(error)}`,
      );
    }
  }
}
