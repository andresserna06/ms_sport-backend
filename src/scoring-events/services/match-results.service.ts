import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { MatchResponseDto } from '../../matches/dto/match-response.dto';
import { MatchStatus } from '../../matches/entities/match.entity';
import { MatchesService } from '../../matches/matches.service';
import {
  MATCH_NOTIFIER,
  type MatchNotifier,
} from '../../notifications/ports/match-notifier.port';
import { PlayerContractService } from '../../player-contracts/services/player-contract.service';
import { PlayerService } from '../../players/services/player.service';
import { TeamResponseDto } from '../../teams/dtos/team-response.dto';
import { TeamsService } from '../../teams/services/teams.service';
import { CreateScoringEventDto } from '../dtos/create-scoring-event.dto';
import { FinishMatchDto } from '../dtos/finish-match.dto';
import { ScoringEventResponseDto } from '../dtos/scoring-event-response.dto';
import { UpdateMatchResultDto } from '../dtos/update-match-result.dto';
import { UpdateScoringEventDto } from '../dtos/update-scoring-event.dto';
import { ScoringEventMapper } from '../mappers/scoring-event.mapper';
import {
  SCORING_EVENT_REPOSITORY,
  type ScoringEventRepository,
} from '../repositories/scoring-event.repository';

@Injectable()
export class MatchResultsService {
  constructor(
    @Inject(SCORING_EVENT_REPOSITORY)
    private readonly scoringEventRepository: ScoringEventRepository,
    private readonly matchesService: MatchesService,
    private readonly playerService: PlayerService,
    private readonly teamsService: TeamsService,
    private readonly contractService: PlayerContractService,
    @Inject(MATCH_NOTIFIER)
    private readonly matchNotifier: MatchNotifier,
    private readonly scoringEventMapper: ScoringEventMapper,
  ) {}

  async updateResult(
    matchId: number,
    dto: UpdateMatchResultDto,
  ): Promise<MatchResponseDto> {
    return this.matchesService.updateResult(
      matchId,
      dto.homeScore,
      dto.awayScore,
    );
  }

  async finishMatch(
    matchId: number,
    dto?: FinishMatchDto,
    authorizationHeader?: string,
  ): Promise<MatchResponseDto> {
    const finished = await this.matchesService.finishMatch(
      matchId,
      dto?.homeScore,
      dto?.awayScore,
    );

    const [events, homeTeam, awayTeam] = await Promise.all([
      this.scoringEventRepository.findByMatchId(matchId),
      finished.homeTeamId !== null
        ? this.getTeamOrFail(finished.homeTeamId)
        : Promise.resolve(null),
      finished.awayTeamId !== null
        ? this.getTeamOrFail(finished.awayTeamId)
        : Promise.resolve(null),
    ]);

    void this.matchNotifier.notifyMatchFinished({
      matchId: finished.id,
      homeTeamName: homeTeam?.name ?? `Equipo #${finished.homeTeamId}`,
      awayTeamName: awayTeam?.name ?? `Equipo #${finished.awayTeamId}`,
      homeScore: finished.homeScore ?? 0,
      awayScore: finished.awayScore ?? 0,
      authorizationHeader,
      scoringEvents: events.map((event) => ({
        minute: event.minute,
        type: event.type,
        playerUserId: event.player?.userId,
        playerDocument: event.player?.document ?? `#${event.playerId}`,
        teamName: event.team?.name ?? `Equipo #${event.teamId}`,
      })),
    });

    return finished;
  }

  async createScoringEvent(
    matchId: number,
    dto: CreateScoringEventDto,
    authorizationHeader?: string,
  ): Promise<ScoringEventResponseDto> {
    const { match, playerUserId, playerDocument, teamName } =
      await this.validateScoringEventReferencesAndRules(matchId, dto);

    const entity = this.scoringEventMapper.toEntity(matchId, dto);
    const saved = await this.scoringEventRepository.save(entity);

    const points = this.getPointsForEventType(saved.type);
    await this.adjustMatchScore(
      match,
      saved.teamId === match.homeTeamId ? points : 0,
      saved.teamId === match.awayTeamId ? points : 0,
    );

    void this.matchNotifier.notifyScoringEventCreated({
      matchId,
      playerUserId,
      playerDocument,
      teamName,
      minute: saved.minute,
      type: saved.type,
      authorizationHeader,
    });

    return this.scoringEventMapper.toResponseDto(saved);
  }

  async findScoringEventsByMatch(
    matchId: number,
  ): Promise<ScoringEventResponseDto[]> {
    await this.matchesService.findOne(matchId);
    const events = await this.scoringEventRepository.findByMatchId(matchId);
    return this.scoringEventMapper.toResponseDtoList(events);
  }

  async updateScoringEvent(
    eventId: number,
    dto: UpdateScoringEventDto,
  ): Promise<ScoringEventResponseDto> {
    const existing = await this.scoringEventRepository.findById(eventId);
    if (!existing) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe una anotación con el id ${eventId}`,
      );
    }

    const previousTeamId = existing.teamId;
    const previousPoints = this.getPointsForEventType(existing.type);

    const { match } = await this.validateScoringEventReferencesAndRules(
      existing.matchId,
      dto,
    );

    const updated = this.scoringEventMapper.mergeEntity(existing, dto);
    const saved = await this.scoringEventRepository.save(updated);

    const nextPoints = this.getPointsForEventType(saved.type);
    const deltaHome =
      (saved.teamId === match.homeTeamId ? nextPoints : 0) -
      (previousTeamId === match.homeTeamId ? previousPoints : 0);
    const deltaAway =
      (saved.teamId === match.awayTeamId ? nextPoints : 0) -
      (previousTeamId === match.awayTeamId ? previousPoints : 0);

    if (deltaHome !== 0 || deltaAway !== 0) {
      await this.adjustMatchScore(match, deltaHome, deltaAway);
    }

    return this.scoringEventMapper.toResponseDto(saved);
  }

  async removeScoringEvent(eventId: number): Promise<void> {
    const existing = await this.scoringEventRepository.findById(eventId);
    if (!existing) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe una anotación con el id ${eventId}`,
      );
    }

    const { matchId, teamId, type } = existing;
    await this.scoringEventRepository.remove(existing);

    const match = await this.matchesService.findOne(matchId);
    if (
      match.status !== MatchStatus.CANCELLED &&
      match.homeTeamId !== null &&
      match.awayTeamId !== null
    ) {
      const points = this.getPointsForEventType(type);
      await this.adjustMatchScore(
        match,
        teamId === match.homeTeamId ? -points : 0,
        teamId === match.awayTeamId ? -points : 0,
      );
    }
  }

  private async validateScoringEventReferencesAndRules(
    matchId: number,
    dto: CreateScoringEventDto,
  ): Promise<{
    match: MatchResponseDto;
    playerUserId: number;
    playerDocument: string;
    teamName: string;
  }> {
    const match = await this.matchesService.findOne(matchId);
    const player = await this.playerService.findOne(dto.playerId);
    const team = await this.getTeamOrFail(dto.teamId);

    if (match.status === MatchStatus.CANCELLED) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se pueden registrar anotaciones en el partido #${matchId} porque está cancelado`,
      );
    }

    if (match.homeTeamId === null || match.awayTeamId === null) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El partido #${matchId} no tiene equipos participantes asignados`,
      );
    }

    if (dto.teamId !== match.homeTeamId && dto.teamId !== match.awayTeamId) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo ${team.name} no participa en el partido #${matchId}`,
      );
    }

    const matchDate = this.normalizeDateUtc(match.scheduledAt);
    const hasContractOnMatchDate =
      await this.contractService.hasActiveContractOnDate(
        dto.playerId,
        dto.teamId,
        matchDate,
      );

    if (!hasContractOnMatchDate) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El jugador ${dto.playerId} no tiene contrato vigente con el equipo ${team.name} en la fecha del partido (${matchDate})`,
      );
    }

    return {
      match,
      playerUserId: player.userId,
      playerDocument: player.document,
      teamName: team.name,
    };
  }

  private getPointsForEventType(type: string): number {
    const normalized = type.trim().toUpperCase();
    if (normalized === 'TRIPLE') {
      return 3;
    }
    if (normalized === 'DOBLE') {
      return 2;
    }
    return 1;
  }

  private async adjustMatchScore(
    match: MatchResponseDto,
    deltaHome: number,
    deltaAway: number,
  ): Promise<void> {
    const nextHomeScore = Math.max(0, (match.homeScore ?? 0) + deltaHome);
    const nextAwayScore = Math.max(0, (match.awayScore ?? 0) + deltaAway);
    await this.matchesService.updateResult(
      match.id,
      nextHomeScore,
      nextAwayScore,
    );
  }

  private async getTeamOrFail(teamId: number): Promise<TeamResponseDto> {
    try {
      return await this.teamsService.findOne(teamId);
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

  private normalizeDateUtc(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
  }
}
