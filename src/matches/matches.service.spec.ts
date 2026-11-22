import { ApplicationException } from '../exception/application.exception';
import { ErrorCase } from '../exception/error-case.enum';
import { MatchStatus } from './entities/match.entity';
import { MatchesService } from './matches.service';

describe('MatchesService', () => {
  let service: MatchesService;
  let matchesRepository: any;
  let phasesService: any;
  let groupService: any;
  let registrationsService: any;
  let teamsService: any;
  let matchMapper: any;
  let dependenciesChecker: any;
  let matchNotifier: any;

  const phase = { id: 10, phaseType: 'GROUP', tournament: { id: 1 } };
  const matchEntity = {
    id: 5,
    status: MatchStatus.SCHEDULED,
    homeTeamId: 100,
    awayTeamId: 200,
    phase,
  };

  beforeEach(() => {
    matchesRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByPhase: jest.fn(),
      remove: jest.fn(),
    };
    phasesService = { findOneEntity: jest.fn() };
    groupService = { assertTeamBelongsToGroup: jest.fn() };
    registrationsService = { assertTeamRegisteredInTournament: jest.fn() };
    teamsService = { findOneEntity: jest.fn() };
    matchMapper = {
      toEntity: jest.fn().mockReturnValue({}),
      mergeEntity: jest.fn().mockImplementation((m) => m),
      toResponseDto: jest.fn().mockImplementation((m) => ({ id: m.id, phaseId: m.phase?.id ?? 10, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, scheduledAt: m.scheduledAt ?? new Date('2030-01-01T10:00:00Z') })),
      toResponseDtoList: jest.fn().mockReturnValue([]),
    };
    dependenciesChecker = { hasScoringEvents: jest.fn(), hasBlockingDependencies: jest.fn() };
    matchNotifier = { notifyMatchCreated: jest.fn().mockResolvedValue(undefined) };

    service = new MatchesService(
      matchesRepository,
      phasesService,
      groupService,
      registrationsService,
      teamsService,
      matchMapper,
      dependenciesChecker,
      matchNotifier,
    );
  });

  it('rejects update when moving match to phase in another tournament', async () => {
    matchesRepository.findById.mockResolvedValue({ ...matchEntity, phase: { id: 10, phaseType: 'GROUP', tournament: { id: 1 } } });
    phasesService.findOneEntity.mockResolvedValue({ id: 20, phaseType: 'GROUP', tournament: { id: 2 } });

    await expect(service.update(5, { phaseId: 20 })).rejects.toMatchObject({
      constructor: ApplicationException,
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(matchesRepository.save).not.toHaveBeenCalled();
  });

  it('allows update when target phase is in same tournament', async () => {
    const entity = { ...matchEntity, phase: { id: 10, phaseType: 'GROUP', tournament: { id: 1 } } };
    matchesRepository.findById.mockResolvedValue(entity);
    phasesService.findOneEntity.mockResolvedValue({ id: 11, phaseType: 'GROUP', tournament: { id: 1 } });
    teamsService.findOneEntity.mockImplementation(async (id: number) => ({ id, active: true }));
    registrationsService.assertTeamRegisteredInTournament.mockResolvedValue(undefined);
    groupService.assertTeamBelongsToGroup.mockResolvedValue(undefined);
    matchesRepository.save.mockResolvedValue({ ...entity, phase: { id: 11, phaseType: 'GROUP', tournament: { id: 1 } } });

    await expect(service.update(5, { phaseId: 11 })).resolves.toMatchObject({ id: 5 });
    expect(matchesRepository.save).toHaveBeenCalled();
  });

  it('blocks remove when blocking dependencies exist', async () => {
    matchesRepository.findById.mockResolvedValue({ ...matchEntity });
    dependenciesChecker.hasBlockingDependencies.mockResolvedValue(true);

    await expect(service.remove(5)).rejects.toMatchObject({
      constructor: ApplicationException,
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(matchesRepository.remove).not.toHaveBeenCalled();
  });

  it('does not fail create when match created notification fails', async () => {
    phasesService.findOneEntity.mockResolvedValue(phase);
    teamsService.findOneEntity.mockImplementation(async (id: number) => ({ id, active: true }));
    registrationsService.assertTeamRegisteredInTournament.mockResolvedValue(undefined);
    groupService.assertTeamBelongsToGroup.mockResolvedValue(undefined);
    matchesRepository.save.mockResolvedValue({ id: 5 });
    matchesRepository.findById.mockResolvedValue({ ...matchEntity });
    matchNotifier.notifyMatchCreated.mockRejectedValue(new Error('smtp down'));

    await expect(service.create(10, { scheduledAt: '2030-01-01T10:00:00Z', homeTeamId: 100, awayTeamId: 200 } as any)).resolves.toMatchObject({ id: 5 });
  });
});
