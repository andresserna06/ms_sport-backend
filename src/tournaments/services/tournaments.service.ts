import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { SportsService } from '../../sports/services/sports.service';
import { CreateTournamentDto } from '../dtos/create-tournament.dto';
import { TournamentOverviewDto } from '../dtos/tournament-overview.dto';
import { TournamentResponseDto } from '../dtos/tournament-response.dto';
import { UpdateTournamentDto } from '../dtos/update-tournament.dto';
import { Tournament } from '../entities/tournament.entity';
import { TournamentOverviewMapper } from '../mappers/tournament-overview.mapper';
import { TournamentMapper } from '../mappers/tournament.mapper';
import {
  TOURNAMENT_OVERVIEW_READER,
  type TournamentOverviewReader,
} from '../repositories/tournament-overview.reader';
import {
  DuplicateTournamentNameError,
  TOURNAMENT_REPOSITORY,
  TournamentInUseError,
  TournamentSportMissingError,
  type TournamentFilter,
  type TournamentRepository,
} from '../repositories/tournament.repository';

@Injectable()
export class TournamentsService {
  constructor(
    @Inject(TOURNAMENT_REPOSITORY)
    private readonly repository: TournamentRepository,
    private readonly mapper: TournamentMapper,
    private readonly sportsService: SportsService,
    @Inject(TOURNAMENT_OVERVIEW_READER)
    private readonly overviewReader: TournamentOverviewReader,
    private readonly overviewMapper: TournamentOverviewMapper,
  ) {}

  async create(dto: CreateTournamentDto): Promise<TournamentResponseDto> {
    this.validateDates(dto.startDate, dto.enrollmentDeadline);
    await this.ensureSportIsAvailable(dto.sportId);
    await this.ensureNameIsAvailable(dto.sportId, dto.name);

    const saved = await this.save(this.mapper.toEntity(dto));
    return this.getDetailOrFail(saved.id);
  }

  async findAll(filter: TournamentFilter): Promise<TournamentResponseDto[]> {
    const tournaments = await this.repository.findAll(filter);
    return this.mapper.toResponseDtoList(tournaments);
  }

  async findOne(id: number): Promise<TournamentResponseDto> {
    return this.getDetailOrFail(id);
  }

  async update(
    id: number,
    dto: UpdateTournamentDto,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.getOrFail(id);
    this.validateDates(dto.startDate, dto.enrollmentDeadline);

    // An inactive sport only blocks a change of sport, so a tournament whose
    // sport was deactivated later can still be corrected.
    if (dto.sportId !== tournament.sportId) {
      await this.ensureSportIsAvailable(dto.sportId);
    }
    await this.ensureNameIsAvailable(dto.sportId, dto.name, id);

    await this.save(this.mapper.replaceEntity(tournament, dto));
    return this.getDetailOrFail(id);
  }

  async deactivate(id: number): Promise<TournamentResponseDto> {
    return this.changeStatus(id, false);
  }

  async activate(id: number): Promise<TournamentResponseDto> {
    return this.changeStatus(id, true);
  }

  async remove(id: number): Promise<void> {
    const tournament = await this.getOrFail(id);

    const { phases, matches, registrations, venues } =
      await this.repository.countDependencies(id);
    const parts: [number, string, string][] = [
      [phases, 'fase', 'fases'],
      [matches, 'partido', 'partidos'],
      [registrations, 'equipo inscrito', 'equipos inscritos'],
      [venues, 'escenario asociado', 'escenarios asociados'],
    ];
    const blockers = parts
      .filter(([total]) => total > 0)
      .map(([total, one, many]) => `${total} ${total === 1 ? one : many}`);

    if (blockers.length > 0) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede eliminar el torneo "${tournament.name}": tiene ${blockers.join(', ')}. Desactívelo en su lugar.`,
      );
    }

    try {
      await this.repository.remove(tournament);
    } catch (error) {
      // Something started referencing the tournament after the count.
      if (error instanceof TournamentInUseError) {
        throw new ApplicationException(
          ErrorCase.INVALID_STATE,
          `No se puede eliminar el torneo "${tournament.name}": acaba de recibir información asociada. Desactívelo en su lugar.`,
        );
      }
      throw error;
    }
  }

  // HU-GC-08: the tournament with its phases, matches, scoring events, group
  // teams with standings and knockout brackets. Read only, five queries at
  // most; only data of this tournament.
  async getOverview(id: number): Promise<TournamentOverviewDto> {
    const tournament = await this.getDetailOrFail(id);

    const phases = await this.overviewReader.findPhases(id);
    const matches = await this.overviewReader.findMatches(
      phases.map((phase) => phase.id),
    );
    const scoringEvents = await this.overviewReader.findScoringEvents(
      matches.map((match) => match.id),
    );
    const groupTeams = await this.overviewReader.findGroupTeams(
      phases.filter((phase) => phase.phaseType === 'GROUP').map((phase) => phase.id),
    );

    return this.overviewMapper.toOverview(
      tournament,
      phases,
      matches,
      scoringEvents,
      groupTeams,
    );
  }

  async getOpenEnrollmentReport(): Promise<TournamentResponseDto[]> {
    const tournaments = await this.repository.findOpenEnrollment();
    return this.mapper.toResponseDtoList(tournaments);
  }

  private async changeStatus(
    id: number,
    active: boolean,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.getOrFail(id);
    tournament.active = active;
    await this.repository.save(tournament);
    return this.getDetailOrFail(id);
  }

  private async getOrFail(id: number): Promise<Tournament> {
    const tournament = await this.repository.findById(id);
    if (!tournament) throw this.notFound(id);
    return tournament;
  }

  private async getDetailOrFail(id: number): Promise<TournamentResponseDto> {
    const tournament = await this.repository.findDetail(id);
    if (!tournament) throw this.notFound(id);
    return this.mapper.toResponseDto(tournament);
  }

  private notFound(id: number): ApplicationException {
    return new ApplicationException(
      ErrorCase.NOT_FOUND,
      `No existe el torneo con id ${id}`,
    );
  }

  private validateDates(startDate: string, enrollmentDeadline: string): void {
    if (enrollmentDeadline > startDate) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'La fecha límite de inscripción no puede ser posterior a la fecha de inicio',
      );
    }
  }

  // The sport must exist (404) and be active (409).
  private async ensureSportIsAvailable(sportId: number): Promise<void> {
    const sport = await this.sportsService.findOne(sportId);
    if (!sport.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El deporte "${sport.name}" está inactivo y no admite nuevos torneos`,
      );
    }
  }

  private async ensureNameIsAvailable(
    sportId: number,
    name: string,
    ignoreId?: number,
  ): Promise<void> {
    if (await this.repository.existsByName(sportId, name, ignoreId)) {
      throw this.duplicateName(name);
    }
  }

  // The name check above is not atomic; the UNIQUE index decides when two
  // requests race, and a sport deleted in the meantime surfaces as a missing
  // row.
  private async save(tournament: Tournament): Promise<Tournament> {
    try {
      return await this.repository.save(tournament);
    } catch (error) {
      if (error instanceof DuplicateTournamentNameError) {
        throw this.duplicateName(tournament.name);
      }
      if (error instanceof TournamentSportMissingError) {
        throw new ApplicationException(
          ErrorCase.NOT_FOUND,
          `No existe el deporte con id ${tournament.sportId}`,
        );
      }
      throw error;
    }
  }

  private duplicateName(name: string): ApplicationException {
    return new ApplicationException(
      ErrorCase.ALREADY_EXISTS,
      `Ya existe un torneo llamado "${name}" en este deporte`,
    );
  }
}
