import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { Sport } from '../../sports/entities/sport.entity';
import type { SportsService } from '../../sports/services/sports.service';
import { Tournament } from '../entities/tournament.entity';
import { TournamentOverviewMapper } from '../mappers/tournament-overview.mapper';
import { TournamentMapper } from '../mappers/tournament.mapper';
import type { TournamentOverviewReader } from '../repositories/tournament-overview.reader';
import {
  DuplicateTournamentNameError,
  TournamentInUseError,
  TournamentSportMissingError,
  type TournamentRepository,
} from '../repositories/tournament.repository';
import { TournamentsService } from './tournaments.service';

const sport = Object.assign(new Sport(), { id: 5, name: 'Fútbol' });

const buildTournament = (overrides: Partial<Tournament> = {}): Tournament =>
  Object.assign(new Tournament(), {
    id: 1,
    name: 'Copa',
    sportId: 5,
    sport,
    startDate: '2027-03-01',
    enrollmentDeadline: '2027-02-01',
    active: true,
    ...overrides,
  });

const dto = {
  name: 'Copa',
  sportId: 5,
  startDate: '2027-03-01',
  enrollmentDeadline: '2027-02-01',
};

const notFound = () =>
  new ApplicationException(
    ErrorCase.NOT_FOUND,
    'No existe el deporte con id 5',
  );

describe('TournamentsService', () => {
  let repository: jest.Mocked<TournamentRepository>;
  let sportsService: { findOne: jest.Mock };
  let overviewReader: jest.Mocked<TournamentOverviewReader>;
  let service: TournamentsService;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findDetail: jest.fn().mockResolvedValue(buildTournament()),
      findAll: jest.fn().mockResolvedValue([]),
      findOpenEnrollment: jest.fn().mockResolvedValue([]),
      existsByName: jest.fn().mockResolvedValue(false),
      countDependencies: jest
        .fn()
        .mockResolvedValue({ phases: 0, matches: 0, registrations: 0, venues: 0 }),
      save: jest.fn(async (tournament: Tournament) =>
        Object.assign(tournament, { id: tournament.id ?? 1 }),
      ),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    sportsService = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 5, name: 'Fútbol', active: true }),
    };
    overviewReader = {
      findPhases: jest.fn().mockResolvedValue([]),
      findMatches: jest.fn().mockResolvedValue([]),
      findScoringEvents: jest.fn().mockResolvedValue([]),
      findGroupTeams: jest.fn().mockResolvedValue([]),
    };
    service = new TournamentsService(
      repository,
      new TournamentMapper(),
      sportsService as unknown as SportsService,
      overviewReader,
      new TournamentOverviewMapper(),
    );
  });

  describe('create', () => {
    it('creates an active tournament and answers with its sport', async () => {
      await expect(service.create(dto)).resolves.toEqual({
        id: 1,
        name: 'Copa',
        sport: { id: 5, name: 'Fútbol' },
        startDate: '2027-03-01',
        enrollmentDeadline: '2027-02-01',
        active: true,
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ active: true, sportId: 5 }),
      );
    });

    it('allows the deadline to be the same day as the start', async () => {
      await expect(
        service.create({ ...dto, enrollmentDeadline: '2027-03-01' }),
      ).resolves.toBeDefined();
    });

    it('rejects a deadline after the start date (400) before anything else', async () => {
      await expect(
        service.create({ ...dto, enrollmentDeadline: '2027-03-02' }),
      ).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_OPERATION });
      expect(sportsService.findOne).not.toHaveBeenCalled();
    });

    it('answers 404 for an unknown sport', async () => {
      sportsService.findOne.mockRejectedValue(notFound());

      await expect(service.create(dto)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('answers 409 for an inactive sport', async () => {
      sportsService.findOne.mockResolvedValue({
        id: 5,
        name: 'Squash',
        active: false,
      });

      await expect(service.create(dto)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
        message: expect.stringContaining('Squash'),
      });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('answers 409 for a repeated name in the same sport', async () => {
      repository.existsByName.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toMatchObject({
        errorCase: ErrorCase.ALREADY_EXISTS,
        message: 'Ya existe un torneo llamado "Copa" en este deporte',
      });
      expect(repository.existsByName).toHaveBeenCalledWith(
        5,
        'Copa',
        undefined,
      );
    });

    it('answers 409, not 500, when the unique index rejects a concurrent duplicate', async () => {
      repository.save.mockRejectedValue(new DuplicateTournamentNameError());

      await expect(service.create(dto)).rejects.toMatchObject({
        errorCase: ErrorCase.ALREADY_EXISTS,
      });
    });

    it('answers 404 when the sport disappears before the insert', async () => {
      repository.save.mockRejectedValue(new TournamentSportMissingError());

      await expect(service.create(dto)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
    });

    it('rethrows unexpected persistence errors', async () => {
      repository.save.mockRejectedValue(new Error('boom'));

      await expect(service.create(dto)).rejects.toThrow('boom');
    });
  });

  describe('queries', () => {
    it('passes the filters to the repository', async () => {
      await service.findAll({ active: true, sportId: 5, name: 'copa' });

      expect(repository.findAll).toHaveBeenCalledWith({
        active: true,
        sportId: 5,
        name: 'copa',
      });
    });

    it('answers 404 for an unknown tournament', async () => {
      repository.findDetail.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
        message: 'No existe el torneo con id 1',
      });
    });

    it('lists the tournaments with open enrollment', async () => {
      repository.findOpenEnrollment.mockResolvedValue([buildTournament()]);

      await expect(service.getOpenEnrollmentReport()).resolves.toHaveLength(1);
    });
  });

  describe('getOverview', () => {
    it('answers 404 for an unknown tournament without reading anything else', async () => {
      repository.findDetail.mockResolvedValue(null);

      await expect(service.getOverview(1)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
        message: 'No existe el torneo con id 1',
      });
      expect(overviewReader.findPhases).not.toHaveBeenCalled();
    });

    it('answers 200 with a message when the tournament has no phases', async () => {
      const overview = await service.getOverview(1);

      expect(overview.phases).toEqual([]);
      expect(overview.message).toBe(
        'El torneo aún no tiene fases configuradas',
      );
      expect(overview.tournament.id).toBe(1);
      expect(overviewReader.findMatches).toHaveBeenCalledWith([]);
    });

    it('reads phases, then matches of those phases, then their events', async () => {
      overviewReader.findPhases.mockResolvedValue([
        { id: 10, name: 'Grupos', order: 1, phaseType: 'GROUP' },
      ]);
      overviewReader.findMatches.mockResolvedValue([
        {
          id: 77,
          phaseId: 10,
          scheduledAt: new Date('2027-03-01T15:00:00Z'),
          status: 'FINISHED',
          homeScore: 2,
          awayScore: 1,
          homeTeam: { id: 1, name: 'A' },
          awayTeam: { id: 2, name: 'B' },
        },
      ]);

      const overview = await service.getOverview(1);

      expect(overviewReader.findMatches).toHaveBeenCalledWith([10]);
      expect(overviewReader.findScoringEvents).toHaveBeenCalledWith([77]);
      expect(overviewReader.findGroupTeams).toHaveBeenCalledWith([10]);
      expect(overview.message).toBeUndefined();
      expect(overview.phases[0].matches).toHaveLength(1);
    });

    it('still answers for an inactive tournament', async () => {
      repository.findDetail.mockResolvedValue(
        buildTournament({ active: false }),
      );

      await expect(service.getOverview(1)).resolves.toMatchObject({
        tournament: { active: false },
      });
    });
  });

  describe('update', () => {
    beforeEach(() => repository.findById.mockResolvedValue(buildTournament()));

    it('replaces every field', async () => {
      await service.update(1, {
        ...dto,
        name: 'Copa Nueva',
        startDate: '2027-04-01',
        enrollmentDeadline: '2027-03-01',
      });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Copa Nueva',
          startDate: '2027-04-01',
          enrollmentDeadline: '2027-03-01',
        }),
      );
    });

    it('does not require an active sport when the sport does not change', async () => {
      sportsService.findOne.mockResolvedValue({
        id: 5,
        name: 'Fútbol',
        active: false,
      });

      await expect(service.update(1, dto)).resolves.toBeDefined();
      expect(sportsService.findOne).not.toHaveBeenCalled();
    });

    it('requires an existing and active sport when it changes', async () => {
      sportsService.findOne.mockResolvedValue({
        id: 6,
        name: 'Squash',
        active: false,
      });

      await expect(
        service.update(1, { ...dto, sportId: 6 }),
      ).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
      });
      expect(sportsService.findOne).toHaveBeenCalledWith(6);
    });

    it('allows keeping its own name', async () => {
      await service.update(1, dto);

      expect(repository.existsByName).toHaveBeenCalledWith(5, 'Copa', 1);
    });

    it('answers 409 when the name belongs to another tournament of the sport', async () => {
      repository.existsByName.mockResolvedValue(true);

      await expect(service.update(1, dto)).rejects.toMatchObject({
        errorCase: ErrorCase.ALREADY_EXISTS,
      });
    });

    it('rejects a deadline after the start date', async () => {
      await expect(
        service.update(1, { ...dto, enrollmentDeadline: '2027-04-01' }),
      ).rejects.toMatchObject({ errorCase: ErrorCase.INVALID_OPERATION });
    });

    it('answers 404 for an unknown tournament', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update(1, dto)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
    });
  });

  describe('activate and deactivate', () => {
    it('changes only the active flag', async () => {
      repository.findById.mockResolvedValue(buildTournament());

      await service.deactivate(1);
      expect(repository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ active: false }),
      );

      await service.activate(1);
      expect(repository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ active: true }),
      );
    });

    it('answers 404 for an unknown tournament', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deactivate(1)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
    });
  });

  describe('remove', () => {
    beforeEach(() => repository.findById.mockResolvedValue(buildTournament()));

    it('deletes a tournament without dependencies', async () => {
      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repository.remove).toHaveBeenCalled();
    });

    it('lists phases and matches in the 409 message', async () => {
      repository.countDependencies.mockResolvedValue({
        phases: 2,
        matches: 3,
        registrations: 4,
        venues: 1,
      });

      await expect(service.remove(1)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
        message:
          'No se puede eliminar el torneo "Copa": tiene 2 fases, 3 partidos, 4 equipos inscritos, 1 escenario asociado. Desactívelo en su lugar.',
      });
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('uses the singular and only mentions what exists', async () => {
      repository.countDependencies.mockResolvedValue({
        phases: 1,
        matches: 0,
        registrations: 0,
        venues: 0,
      });

      await expect(service.remove(1)).rejects.toThrow('tiene 1 fase.');
    });

    it('answers 409, not 500, when a foreign key blocks the delete', async () => {
      repository.remove.mockRejectedValue(new TournamentInUseError());

      await expect(service.remove(1)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
      });
    });

    it('rethrows unexpected persistence errors', async () => {
      repository.remove.mockRejectedValue(new Error('boom'));

      await expect(service.remove(1)).rejects.toThrow('boom');
    });

    it('answers 404 for an unknown tournament', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
    });
  });
});
