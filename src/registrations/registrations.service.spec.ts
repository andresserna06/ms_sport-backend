import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationException } from '../exception/application.exception';
import { ErrorCase } from '../exception/error-case.enum';
import { Match } from '../matches/entities/match.entity';
import { Group } from '../phases/group/entities/group.entity';
import { TeamSport } from '../team-sports/entities/team-sport.entity';
import { Team } from '../teams/entities/team.entity';
import { Tournament, TournamentStatus } from '../tournaments/entities/tournament.entity';
import { RegistrationMapper } from './mappers/registration.mapper';
import { REGISTRATION_REPOSITORY } from './repositories/registrations.repository';
import { RegistrationsService } from './registrations.service';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let registrationsRepository: { findById: jest.Mock; findByTournamentAndTeam: jest.Mock; save: jest.Mock };
  let teamsRepository: { findOne: jest.Mock };
  let tournamentsRepository: { findOne: jest.Mock };
  let groupsRepository: { createQueryBuilder: jest.Mock };
  let matchesRepository: { createQueryBuilder: jest.Mock };
  let teamSportsRepository: { findOne: jest.Mock };

  const team = { id: 10, name: 'Team A', active: true } as Team;
  const tournament = {
    id: 20,
    name: 'Tournament A',
    active: true,
    sportId: 30,
    status: TournamentStatus.SCHEDULED,
    enrollmentDeadline: '2099-12-31',
  } as Tournament;
  const registration = {
    id: 1,
    team,
    tournament,
    status: 'CONFIRMED',
    withdrawnAt: null,
    registeredAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    registrationsRepository = {
      findById: jest.fn(),
      findByTournamentAndTeam: jest.fn(),
      save: jest.fn(),
    };
    teamsRepository = { findOne: jest.fn() };
    tournamentsRepository = { findOne: jest.fn() };
    groupsRepository = { createQueryBuilder: jest.fn() };
    matchesRepository = { createQueryBuilder: jest.fn() };
    teamSportsRepository = { findOne: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        RegistrationMapper,
        { provide: REGISTRATION_REPOSITORY, useValue: registrationsRepository },
        { provide: getRepositoryToken(Team), useValue: teamsRepository },
        { provide: getRepositoryToken(Tournament), useValue: tournamentsRepository },
        { provide: getRepositoryToken(Group), useValue: groupsRepository },
        { provide: getRepositoryToken(Match), useValue: matchesRepository },
        { provide: getRepositoryToken(TeamSport), useValue: teamSportsRepository },
      ],
    }).compile();

    service = moduleRef.get(RegistrationsService);
  });

  it('creates a registration when team is associated with tournament sport', async () => {
    tournamentsRepository.findOne.mockResolvedValue(tournament);
    teamsRepository.findOne.mockResolvedValue(team);
    teamSportsRepository.findOne.mockResolvedValue({ id: 99, teamId: 10, sportId: 30 });
    registrationsRepository.findByTournamentAndTeam.mockResolvedValue(null);
    registrationsRepository.save.mockResolvedValue({ id: 1 });
    registrationsRepository.findById.mockResolvedValue(registration);

    const result = await service.create(20, { teamId: 10 });

    expect(teamSportsRepository.findOne).toHaveBeenCalledWith({
      where: { teamId: 10, sportId: 30 },
    });
    expect(result).toMatchObject({ id: 1, team: { id: 10 }, tournament: { id: 20 } });
  });

  it('throws INVALID_STATE when tournament has no sport', async () => {
    tournamentsRepository.findOne.mockResolvedValue({ ...tournament, sportId: null });
    teamsRepository.findOne.mockResolvedValue(team);

    await expect(service.create(20, { teamId: 10 })).rejects.toMatchObject({
      constructor: ApplicationException,
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(teamSportsRepository.findOne).not.toHaveBeenCalled();
  });

  it('throws INVALID_STATE when team is not associated with tournament sport', async () => {
    tournamentsRepository.findOne.mockResolvedValue(tournament);
    teamsRepository.findOne.mockResolvedValue(team);
    teamSportsRepository.findOne.mockResolvedValue(null);

    await expect(service.create(20, { teamId: 10 })).rejects.toMatchObject({
      constructor: ApplicationException,
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(registrationsRepository.save).not.toHaveBeenCalled();
  });

  it('throws ALREADY_EXISTS when registration is duplicated', async () => {
    tournamentsRepository.findOne.mockResolvedValue(tournament);
    teamsRepository.findOne.mockResolvedValue(team);
    teamSportsRepository.findOne.mockResolvedValue({ id: 99, teamId: 10, sportId: 30 });
    registrationsRepository.findByTournamentAndTeam.mockResolvedValue(registration);

    await expect(service.create(20, { teamId: 10 })).rejects.toMatchObject({
      constructor: ApplicationException,
      errorCase: ErrorCase.ALREADY_EXISTS,
    });
  });

  it('reactivates a withdrawn registration instead of creating a new row', async () => {
    tournamentsRepository.findOne.mockResolvedValue(tournament);
    teamsRepository.findOne.mockResolvedValue(team);
    teamSportsRepository.findOne.mockResolvedValue({ id: 99, teamId: 10, sportId: 30 });
    registrationsRepository.findByTournamentAndTeam.mockResolvedValue({ ...registration, status: 'WITHDRAWN', withdrawnAt: new Date() });
    registrationsRepository.save.mockImplementation(async (r) => r);
    registrationsRepository.findById.mockResolvedValue({ ...registration, status: 'CONFIRMED', withdrawnAt: null });

    const result = await service.create(20, { teamId: 10 });

    expect(registrationsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'CONFIRMED', withdrawnAt: null }));
    expect(result.status).toBe('CONFIRMED');
  });

  it('withdraw marks registration as withdrawn without deleting row', async () => {
    registrationsRepository.findById.mockResolvedValue({ ...registration, status: 'CONFIRMED', withdrawnAt: null });
    groupsRepository.createQueryBuilder.mockReturnValue({ innerJoin: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(null) });
    matchesRepository.createQueryBuilder.mockReturnValue({ innerJoin: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(null) });
    registrationsRepository.save.mockImplementation(async (r) => r);

    const result = await service.withdraw(1);

    expect(result.status).toBe('WITHDRAWN');
    expect(result.withdrawnAt).toBeInstanceOf(Date);
  });
});

