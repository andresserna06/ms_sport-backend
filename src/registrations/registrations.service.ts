import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationException } from '../exception/application.exception';
import { ErrorCase } from '../exception/error-case.enum';
import { Match } from '../matches/entities/match.entity';
import { Group } from '../phases/group/entities/group.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Team } from '../teams/entities/team.entity';
import { Tournament, TournamentStatus } from '../tournaments/entities/tournament.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { Registration, RegistrationStatus } from './entities/registration.entity';
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
    @InjectRepository(TeamSport)
    private readonly teamSportsRepository: Repository<TeamSport>,
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
    await this.assertTeamSportAssociation(tournament, team.id);

    const existing = await this.registrationsRepository.findByTournamentAndTeam(
      tournament.id,
      team.id,
    );
    if (existing) {
      if (existing.status === RegistrationStatus.CONFIRMED) {
        throw new ApplicationException(
          ErrorCase.ALREADY_EXISTS,
          `El equipo ${team.id} ya est? inscrito en el torneo ${tournament.id}`,
        );
      }
      existing.status = RegistrationStatus.CONFIRMED;
      existing.withdrawnAt = null;
      existing.registeredAt = new Date();
      const saved = await this.registrationsRepository.save(existing);
      const created = await this.registrationsRepository.findById(saved.id);
      return this.registrationMapper.toResponseDto(created ?? saved);
    }

    const saved = await this.registrationsRepository.save(
      this.registrationMapper.toEntity(team, tournament),
    );
    const created = await this.registrationsRepository.findById(saved.id);
    return this.registrationMapper.toResponseDto(created ?? saved);
  }

  async findByTournament(tournamentId: number): Promise<RegistrationResponseDto[]> {
    await this.getTournamentOrFail(tournamentId);
    const registrations = await this.registrationsRepository.findByTournament(tournamentId);
    return this.registrationMapper.toResponseDtoList(registrations);
  }

  async findTournamentsByTeam(teamId: number): Promise<RegistrationResponseDto[]> {
    await this.getTeamOrFail(teamId);
    const registrations = await this.registrationsRepository.findByTeam(teamId);
    return this.registrationMapper.toResponseDtoList(registrations);
  }

  async assertTeamRegisteredInTournament(teamId: number, tournamentId: number): Promise<void> {
    const registration = await this.registrationsRepository.findByTournamentAndTeam(
      tournamentId,
      teamId,
    );
    if (!registration || registration.status !== RegistrationStatus.CONFIRMED) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo ${teamId} no est? inscrito activamente en el torneo ${tournamentId}`,
      );
    }
  }

  async confirm(registrationId: number): Promise<RegistrationResponseDto> {
    const registration = await this.getRegistrationOrFail(registrationId);
    if (registration.status === RegistrationStatus.CONFIRMED) {
      return this.registrationMapper.toResponseDto(registration);
    }
    this.assertTournamentActive(registration.tournament);
    this.assertTeamActive(registration.team);
    this.assertRegistrationOpen(registration.tournament);
    registration.status = RegistrationStatus.CONFIRMED;
    registration.withdrawnAt = null;
    const saved = await this.registrationsRepository.save(registration);
    return this.registrationMapper.toResponseDto(saved);
  }

  async withdraw(registrationId: number): Promise<RegistrationResponseDto> {
    const registration = await this.getRegistrationOrFail(registrationId);
    if (registration.status === RegistrationStatus.WITHDRAWN) {
      return this.registrationMapper.toResponseDto(registration);
    }
    this.assertCanWithdraw(registration.tournament);
    await this.assertTeamNotAssignedToTournamentGroup(registration.tournament.id, registration.team.id);
    await this.assertTeamHasNoMatchesInTournament(registration.tournament.id, registration.team.id);
    registration.status = RegistrationStatus.WITHDRAWN;
    registration.withdrawnAt = new Date();
    const saved = await this.registrationsRepository.save(registration);
    return this.registrationMapper.toResponseDto(saved);
  }

  async withdrawByTournamentAndTeam(tournamentId: number, teamId: number): Promise<RegistrationResponseDto> {
    const tournament = await this.getTournamentOrFail(tournamentId);
    await this.getTeamOrFail(teamId);
    const registration = await this.registrationsRepository.findByTournamentAndTeam(
      tournamentId,
      teamId,
    );
    if (!registration) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe una inscripci?n del equipo ${teamId} en el torneo ${tournamentId}`,
      );
    }
    return this.withdraw(registration.id);
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
        `El torneo ${tournament.id} est? inactivo y no permite inscripciones`,
      );
    }
  }

  private assertTeamActive(team: Team): void {
    if (!team.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo ${team.id} est? inactivo y no puede inscribirse`,
      );
    }
  }

  private assertRegistrationOpen(tournament: Tournament): void {
    if (this.hasTournamentStarted(tournament) || this.isRegistrationDeadlinePassed(tournament)) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El torneo ${tournament.id} no permite inscripciones porque ya inici? o el periodo de inscripciones est? cerrado`,
      );
    }
  }

  private assertCanWithdraw(tournament: Tournament): void {
    if (this.hasTournamentStarted(tournament) || this.isRegistrationDeadlinePassed(tournament)) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El torneo ${tournament.id} no permite retiros porque ya inici? o el periodo de inscripciones est? cerrado`,
      );
    }
  }

  private hasTournamentStarted(tournament: Tournament): boolean {
    return tournament.status !== TournamentStatus.SCHEDULED;
  }

  private isRegistrationDeadlinePassed(tournament: Tournament): boolean {
    return this.today() > tournament.enrollmentDeadline;
  }

  private async assertTeamSportAssociation(
    tournament: Tournament,
    teamId: number,
  ): Promise<void> {
    if (tournament.sportId == null) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede validar la asociaci?n equipo-deporte del torneo ${tournament.id} porque el torneo no tiene un deporte definido`,
      );
    }

    const teamSport = await this.teamSportsRepository.findOne({
      where: { teamId, sportId: tournament.sportId },
    });
    if (!teamSport) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo ${teamId} no est? asociado al deporte del torneo ${tournament.id}`,
      );
    }
  }

  private async getRegistrationOrFail(id: number): Promise<Registration> {
    const registration = await this.registrationsRepository.findById(id);
    if (!registration) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe una inscripci?n con el id ${id}`,
      );
    }
    return registration;
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
        `No se puede retirar la inscripci?n del equipo ${teamId} porque est? asignado a un grupo del torneo ${tournamentId}`,
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
        `No se puede retirar la inscripci?n del equipo ${teamId} porque tiene partidos en el torneo ${tournamentId}`,
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

