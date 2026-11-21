import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationException } from '../exception/application.exception';
import { ErrorCase } from '../exception/error-case.enum';
import { Match } from '../matches/entities/match.entity';
import { Group } from '../phases/group/entities/group.entity';
import { Team } from '../teams/entities/team.entity';
import { Tournament, TournamentStatus } from '../tournaments/entities/tournament.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationResponseDto, RegistrationSummaryDto } from './dto/registration-response.dto';
import { Registration } from './entities/registration.entity';
import { RegistrationMapper } from './mappers/registration.mapper';
import {
  REGISTRATION_REPOSITORY,
  type RegistrationRepository,
} from './repositories/registrations.repository';

@Injectable()
export class RegistrationsService {
  constructor(
    @Inject(REGISTRATION_REPOSITORY)
    private readonly registrationsRepository: RegistrationRepository,
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    @InjectRepository(Tournament)
    private readonly tournamentsRepository: Repository<Tournament>,
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    private readonly registrationMapper: RegistrationMapper,
  ) {}

  async create(
    tournamentId: number,
    dto: CreateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    const tournament = await this.getTournamentOrFail(tournamentId);
    const team = await this.getTeamOrFail(dto.teamId);

    this.assertTournamentActive(tournament);
    this.assertTeamActive(team);
    this.assertRegistrationOpen(tournament);
    this.assertTeamSportAssociation(tournament);
    await this.assertNotDuplicated(tournament.id, team.id);

    const saved = await this.registrationsRepository.save(
      this.registrationMapper.toEntity(team, tournament),
    );
    const created = await this.registrationsRepository.findById(saved.id);
    return this.registrationMapper.toResponseDto(created ?? saved);
  }

  async findByTournament(tournamentId: number): Promise<RegistrationSummaryDto[]> {
    await this.getTournamentOrFail(tournamentId);
    const registrations = await this.registrationsRepository.findByTournament(tournamentId);
    return registrations.map((registration) => ({
      id: registration.team.id,
      name: registration.team.name,
    }));
  }

  async findTournamentsByTeam(teamId: number): Promise<RegistrationSummaryDto[]> {
    await this.getTeamOrFail(teamId);
    const registrations = await this.registrationsRepository.findByTeam(teamId);
    return registrations.map((registration) => ({
      id: registration.tournament.id,
      name: registration.tournament.name,
    }));
  }

  async assertTeamRegisteredInTournament(teamId: number, tournamentId: number): Promise<void> {
    const registration = await this.registrationsRepository.findByTournamentAndTeam(
      tournamentId,
      teamId,
    );
    if (!registration) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo ${teamId} no está inscrito activamente en el torneo ${tournamentId}`,
      );
    }
  }

  async remove(tournamentId: number, teamId: number): Promise<void> {
    const tournament = await this.getTournamentOrFail(tournamentId);
    await this.getTeamOrFail(teamId);

    const registration = await this.registrationsRepository.findByTournamentAndTeam(
      tournamentId,
      teamId,
    );
    if (!registration) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe una inscripción del equipo ${teamId} en el torneo ${tournamentId}`,
      );
    }

    this.assertCanWithdraw(tournament);
    await this.assertTeamNotAssignedToTournamentGroup(tournamentId, teamId);
    await this.assertTeamHasNoMatchesInTournament(tournamentId, teamId);

    await this.registrationsRepository.remove(registration);
  }

  private async getTeamOrFail(id: number): Promise<Team> {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un equipo con el id ${id}`,
      );
    }
    return team;
  }

  private async getTournamentOrFail(id: number): Promise<Tournament> {
    const tournament = await this.tournamentsRepository.findOne({ where: { id } });
    if (!tournament) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe un torneo con el id ${id}`,
      );
    }
    return tournament;
  }

  private assertTournamentActive(tournament: Tournament): void {
    if (!tournament.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El torneo ${tournament.id} está inactivo y no permite inscripciones`,
      );
    }
  }

  private assertTeamActive(team: Team): void {
    if (!team.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo ${team.id} está inactivo y no puede inscribirse`,
      );
    }
  }

  private assertRegistrationOpen(tournament: Tournament): void {
    if (this.hasTournamentStarted(tournament) || this.isRegistrationDeadlinePassed(tournament)) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El torneo ${tournament.id} no permite inscripciones porque ya inició o el periodo de inscripciones está cerrado`,
      );
    }
  }

  private assertCanWithdraw(tournament: Tournament): void {
    if (this.hasTournamentStarted(tournament) || this.isRegistrationDeadlinePassed(tournament)) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El torneo ${tournament.id} no permite retiros porque ya inició o el periodo de inscripciones está cerrado`,
      );
    }
  }

  private hasTournamentStarted(tournament: Tournament): boolean {
    return tournament.status !== TournamentStatus.SCHEDULED;
  }

  private isRegistrationDeadlinePassed(tournament: Tournament): boolean {
    return this.today() > tournament.registrationDeadline;
  }

  private assertTeamSportAssociation(tournament: Tournament): void {
    if (tournament.sportId == null) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede validar la asociación equipo-deporte del torneo ${tournament.id} porque el torneo no tiene un deporte definido`,
      );
    }

    throw new ApplicationException(
      ErrorCase.INVALID_STATE,
      'No se puede validar que el equipo esté asociado al deporte del torneo porque la dependencia HU-GD-03 (TeamSport) no está implementada',
    );
  }

  private async assertNotDuplicated(tournamentId: number, teamId: number): Promise<void> {
    const existing = await this.registrationsRepository.findByTournamentAndTeam(
      tournamentId,
      teamId,
    );
    if (existing) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `El equipo ${teamId} ya está inscrito en el torneo ${tournamentId}`,
      );
    }
  }

  private async assertTeamNotAssignedToTournamentGroup(
    tournamentId: number,
    teamId: number,
  ): Promise<void> {
    const group = await this.groupsRepository
      .createQueryBuilder('group')
      .innerJoin('group.teams', 'team', 'team.id = :teamId', { teamId })
      .innerJoin('group.tournament', 'tournament', 'tournament.id = :tournamentId', {
        tournamentId,
      })
      .select(['group.id'])
      .getOne();

    if (group) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede retirar la inscripción del equipo ${teamId} porque está asignado a un grupo del torneo ${tournamentId}`,
      );
    }
  }

  private async assertTeamHasNoMatchesInTournament(
    tournamentId: number,
    teamId: number,
  ): Promise<void> {
    const match = await this.matchesRepository
      .createQueryBuilder('match')
      .innerJoin('match.phase', 'phase')
      .innerJoin('phase.tournament', 'tournament', 'tournament.id = :tournamentId', {
        tournamentId,
      })
      .where('(match.homeTeamId = :teamId OR match.awayTeamId = :teamId)', { teamId })
      .select(['match.id'])
      .getOne();

    if (match) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede retirar la inscripción del equipo ${teamId} porque tiene partidos en el torneo ${tournamentId}`,
      );
    }
  }

  private today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
