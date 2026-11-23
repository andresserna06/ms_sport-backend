import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { RegistrationsService } from '../../registrations/registrations.service';
import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { TournamentsService } from '../../tournaments/services/tournaments.service';
import { PhasesService } from '../base/phases.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { Group } from './entities/group.entity';
import { GroupMapper } from './mappers/group.mapper';
import { GroupRepository } from './repositories/group.repository';
import { GroupService } from './group.service';

const makeGroup = (overrides: Partial<Group> = {}): Group =>
  Object.assign(new Group(), {
    id: 3,
    name: 'Group A',
    order: 1,
    tournament: Object.assign(new Tournament(), { id: 7 }),
    teams: [],
    ...overrides,
  });

const makeTeam = (overrides: Partial<Team> = {}): Team =>
  Object.assign(new Team(), {
    id: 1,
    name: 'Lions',
    city: 'Cali',
    contactEmail: 'lions@example.com',
    foundedYear: 2000,
    active: true,
    group: null,
    ...overrides,
  });

describe('GroupService', () => {
  let service: GroupService;
  let repository: jest.Mocked<GroupRepository>;
  let phasesService: jest.Mocked<
    Pick<PhasesService, 'existsByNameInTournament' | 'hasMatches'>
  >;
  let tournamentsService: jest.Mocked<Pick<TournamentsService, 'findOne'>>;
  let registrationsService: jest.Mocked<
    Pick<RegistrationsService, 'assertTeamRegisteredInTournament'>
  >;
  let mapper: GroupMapper;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findTeamById: jest.fn(),
      findTeams: jest.fn(),
      saveTeam: jest.fn(),
    };
    phasesService = {
      existsByNameInTournament: jest.fn(),
      hasMatches: jest.fn(),
    };
    tournamentsService = { findOne: jest.fn() };
    registrationsService = { assertTeamRegisteredInTournament: jest.fn() };
    mapper = new GroupMapper();
    service = new GroupService(
      repository,
      mapper,
      phasesService as unknown as PhasesService,
      tournamentsService as unknown as TournamentsService,
      registrationsService as unknown as RegistrationsService,
    );
  });

  describe('create', () => {
    const dto = Object.assign(new CreateGroupDto(), {
      name: 'Group A',
      order: 1,
      tournamentId: 7,
    });

    it('should create a group when the tournament exists and the name is available', async () => {
      tournamentsService.findOne.mockResolvedValue({ id: 7 } as never);
      phasesService.existsByNameInTournament.mockResolvedValue(false);
      repository.save.mockImplementation(async (group) =>
        Object.assign(group, { id: 5 }),
      );

      const result = await service.create(dto);

      expect(result.id).toBe(5);
      expect(result.name).toBe('Group A');
      expect(result.tournamentId).toBe(7);
      expect(phasesService.existsByNameInTournament).toHaveBeenCalledWith(
        'Group A',
        7,
      );
    });

    it('should throw NOT_FOUND when the tournament does not exist', async () => {
      tournamentsService.findOne.mockRejectedValue(
        new ApplicationException(ErrorCase.NOT_FOUND, 'No existe el torneo con id 7'),
      );

      await expect(service.create(dto)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw ALREADY_EXISTS when the name is already used in the tournament', async () => {
      tournamentsService.findOne.mockResolvedValue({ id: 7 } as never);
      phasesService.existsByNameInTournament.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toMatchObject({
        errorCase: ErrorCase.ALREADY_EXISTS,
      });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should reject a duplicated name inside the same tournament', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      phasesService.existsByNameInTournament.mockResolvedValue(true);

      await expect(
        service.update(3, { name: 'Group B' }),
      ).rejects.toMatchObject({ errorCase: ErrorCase.ALREADY_EXISTS });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should reject the deletion when the group has matches', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      phasesService.hasMatches.mockResolvedValue(true);

      await expect(service.remove(3)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
      });
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should remove the group and keep its teams', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      phasesService.hasMatches.mockResolvedValue(false);

      await expect(service.remove(3)).resolves.toBeUndefined();

      expect(repository.remove).toHaveBeenCalled();
    });
  });

  describe('assignTeam', () => {
    it('should assign an active team that has no group', async () => {
      const group = makeGroup();
      const team = makeTeam();
      const updatedGroup = makeGroup({
        teams: [makeTeam({ id: 1, name: 'Lions' })],
      });
      repository.findById
        .mockResolvedValueOnce(group)
        .mockResolvedValueOnce(updatedGroup);
      repository.findTeamById.mockResolvedValue(team);
      registrationsService.assertTeamRegisteredInTournament.mockResolvedValue(
        undefined,
      );
      repository.saveTeam.mockResolvedValue(team);

      const result = await service.assignTeam(3, 1);

      expect(
        registrationsService.assertTeamRegisteredInTournament,
      ).toHaveBeenCalledWith(1, 7);
      expect(team.group).toBe(group);
      expect(repository.saveTeam).toHaveBeenCalledWith(team);
      expect(result.teams).toEqual([{ id: 1, name: 'Lions' }]);
    });

    it('should throw NOT_FOUND when the team does not exist', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      repository.findTeamById.mockResolvedValue(null);

      await expect(service.assignTeam(3, 99)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
    });

    it('should throw INVALID_STATE when the team is inactive', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      repository.findTeamById.mockResolvedValue(makeTeam({ active: false }));

      await expect(service.assignTeam(3, 1)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
      });
    });

    it('should throw ALREADY_EXISTS when the team is already in the group', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      repository.findTeamById.mockResolvedValue(
        makeTeam({ group: makeGroup({ id: 3 }) }),
      );

      await expect(service.assignTeam(3, 1)).rejects.toMatchObject({
        errorCase: ErrorCase.ALREADY_EXISTS,
      });
    });

    it('should throw INVALID_STATE when the team belongs to another group', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      repository.findTeamById.mockResolvedValue(
        makeTeam({ group: makeGroup({ id: 4 }) }),
      );

      await expect(service.assignTeam(3, 1)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
      });
    });

    it('should throw INVALID_STATE when the team is not registered in tournament', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      repository.findTeamById.mockResolvedValue(makeTeam());
      registrationsService.assertTeamRegisteredInTournament.mockRejectedValue({
        errorCase: ErrorCase.INVALID_STATE,
      });

      await expect(service.assignTeam(3, 1)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
      });
      expect(repository.saveTeam).not.toHaveBeenCalled();
    });
  });

  describe('removeTeam', () => {
    it('should clear the group when the team belongs to it', async () => {
      const group = makeGroup();
      const team = makeTeam({ group });
      repository.findById.mockResolvedValue(group);
      repository.findTeamById.mockResolvedValue(team);
      repository.saveTeam.mockResolvedValue(team);

      await service.removeTeam(3, 1);

      expect(team.group).toBeNull();
      expect(repository.saveTeam).toHaveBeenCalledWith(team);
    });

    it('should throw INVALID_STATE when the team does not belong to the group', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      repository.findTeamById.mockResolvedValue(
        makeTeam({ group: makeGroup({ id: 4 }) }),
      );

      await expect(service.removeTeam(3, 1)).rejects.toMatchObject({
        errorCase: ErrorCase.INVALID_STATE,
      });
    });
  });

  describe('findTeams', () => {
    it('should return the teams of the group as summaries', async () => {
      repository.findById.mockResolvedValue(makeGroup());
      repository.findTeams.mockResolvedValue([
        makeTeam({ id: 1, name: 'Lions' }),
        makeTeam({ id: 2, name: 'Tigers' }),
      ]);

      await expect(service.findTeams(3)).resolves.toEqual([
        { id: 1, name: 'Lions' },
        { id: 2, name: 'Tigers' },
      ]);
    });

    it('should throw NOT_FOUND when the group does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findTeams(3)).rejects.toMatchObject({
        errorCase: ErrorCase.NOT_FOUND,
      });
    });
  });
});
