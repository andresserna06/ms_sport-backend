import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import type { SportsService } from '../../sports/services/sports.service';
import type { TeamsService } from '../../teams/services/teams.service';
import { TeamSport } from '../entities/team-sport.entity';
import { TeamSportMapper } from '../mappers/team-sport.mapper';
import {
  DuplicateTeamSportError,
  TeamSportTargetMissingError,
  type TeamSportRepository,
} from '../repositories/team-sport.repository';
import { TeamSportsService } from './team-sports.service';

const team = { id: 1, name: 'Atlético', active: true };
const sport = { id: 2, name: 'Fútbol', active: true };

const association = (): TeamSport =>
  Object.assign(new TeamSport(), { id: 9, teamId: 1, sportId: 2 });

const notFound = (message: string) =>
  new ApplicationException(ErrorCase.NOT_FOUND, message);

describe('TeamSportsService', () => {
  let repository: jest.Mocked<TeamSportRepository>;
  let teamsService: { findOne: jest.Mock };
  let sportsService: { findOne: jest.Mock };
  let service: TeamSportsService;

  beforeEach(() => {
    repository = {
      findPair: jest.fn().mockResolvedValue(null),
      findByTeam: jest.fn().mockResolvedValue([]),
      findBySport: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(association()),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    teamsService = { findOne: jest.fn().mockResolvedValue(team) };
    sportsService = { findOne: jest.fn().mockResolvedValue(sport) };
    service = new TeamSportsService(
      repository,
      new TeamSportMapper(),
      teamsService as unknown as TeamsService,
      sportsService as unknown as SportsService,
    );
  });

  describe('associate', () => {
    it('creates the association and returns both names', async () => {
      await expect(service.associate(1, 2)).resolves.toEqual({
        id: 9,
        team: { id: 1, name: 'Atlético' },
        sport: { id: 2, name: 'Fútbol' },
      });
      expect(repository.create).toHaveBeenCalledWith(1, 2);
    });

    it('answers 404 for an unknown team before looking at the sport', async () => {
      teamsService.findOne.mockRejectedValue(notFound('No existe un equipo'));

      await expect(service.associate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
      expect(sportsService.findOne).not.toHaveBeenCalled();
    });

    it('answers 404 for an unknown sport', async () => {
      sportsService.findOne.mockRejectedValue(notFound('No existe el deporte'));

      await expect(service.associate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('refuses an inactive team (409)', async () => {
      teamsService.findOne.mockResolvedValue({ ...team, active: false });

      await expect(service.associate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
        message: expect.stringContaining('Atlético'),
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('refuses an inactive sport (409)', async () => {
      sportsService.findOne.mockResolvedValue({ ...sport, active: false });

      await expect(service.associate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
        message: expect.stringContaining('Fútbol'),
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('reports an unknown team before an inactive sport', async () => {
      teamsService.findOne.mockRejectedValue(notFound('No existe un equipo'));
      sportsService.findOne.mockResolvedValue({ ...sport, active: false });

      await expect(service.associate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
    });

    it('refuses a duplicated pair (409)', async () => {
      repository.findPair.mockResolvedValue(association());

      await expect(service.associate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.ALREADY_EXISTS,
        message: 'El equipo "Atlético" ya está asociado al deporte "Fútbol"',
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('answers 409, not 500, when the unique index rejects a concurrent pair', async () => {
      repository.create.mockRejectedValue(new DuplicateTeamSportError());

      await expect(service.associate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.ALREADY_EXISTS,
      });
    });

    it('answers 404 when the team or sport disappears before the insert', async () => {
      repository.create.mockRejectedValue(new TeamSportTargetMissingError());

      await expect(service.associate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
    });

    it('rethrows unexpected persistence errors', async () => {
      repository.create.mockRejectedValue(new Error('boom'));

      await expect(service.associate(1, 2)).rejects.toThrow('boom');
    });
  });

  describe('dissociate', () => {
    it('removes only the association', async () => {
      const found = association();
      repository.findPair.mockResolvedValue(found);

      await expect(service.dissociate(1, 2)).resolves.toBeUndefined();
      expect(repository.remove).toHaveBeenCalledWith(found);
    });

    it('is allowed when the team and the sport are inactive', async () => {
      teamsService.findOne.mockResolvedValue({ ...team, active: false });
      sportsService.findOne.mockResolvedValue({ ...sport, active: false });
      repository.findPair.mockResolvedValue(association());

      await expect(service.dissociate(1, 2)).resolves.toBeUndefined();
    });

    it('answers 404 when the pair is not associated', async () => {
      await expect(service.dissociate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
        message: 'El equipo "Atlético" no está asociado al deporte "Fútbol"',
      });
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('answers 404 for an unknown team or sport', async () => {
      teamsService.findOne.mockRejectedValue(notFound('No existe un equipo'));

      await expect(service.dissociate(1, 2)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
      expect(repository.findPair).not.toHaveBeenCalled();
    });
  });

  describe('lists', () => {
    it('lists the sports of a team with the active filter', async () => {
      repository.findByTeam.mockResolvedValue([
        Object.assign(association(), { sport }),
      ]);

      await expect(service.findSportsOfTeam(1, true)).resolves.toEqual([
        { id: 2, name: 'Fútbol', active: true },
      ]);
      expect(repository.findByTeam).toHaveBeenCalledWith(1, true);
    });

    it('lists the teams of a sport', async () => {
      repository.findBySport.mockResolvedValue([
        Object.assign(association(), { team }),
      ]);

      await expect(service.findTeamsOfSport(2)).resolves.toEqual([
        { id: 1, name: 'Atlético', active: true },
      ]);
      expect(repository.findBySport).toHaveBeenCalledWith(2, undefined);
    });

    it('returns an empty list when there are no associations', async () => {
      await expect(service.findSportsOfTeam(1)).resolves.toEqual([]);
      await expect(service.findTeamsOfSport(2)).resolves.toEqual([]);
    });

    it('answers 404 when the team or the sport does not exist', async () => {
      teamsService.findOne.mockRejectedValue(notFound('No existe un equipo'));
      sportsService.findOne.mockRejectedValue(notFound('No existe el deporte'));

      await expect(service.findSportsOfTeam(1)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
      await expect(service.findTeamsOfSport(2)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
      expect(repository.findByTeam).not.toHaveBeenCalled();
      expect(repository.findBySport).not.toHaveBeenCalled();
    });
  });
});
