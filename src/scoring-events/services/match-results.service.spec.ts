import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { MatchStatus } from '../../matches/entities/match.entity';
import { MatchesService } from '../../matches/matches.service';
import { MatchNotifier } from '../../notifications/ports/match-notifier.port';
import { PlayerContractService } from '../../player-contracts/services/player-contract.service';
import { PlayerService } from '../../players/services/player.service';
import { TeamsService } from '../../teams/teams.service';
import { ScoringEvent } from '../entities/scoring-event.entity';
import { ScoringEventMapper } from '../mappers/scoring-event.mapper';
import { ScoringEventRepository } from '../repositories/scoring-event.repository';
import { MatchResultsService } from './match-results.service';

describe('MatchResultsService', () => {
  let service: MatchResultsService;
  let repository: jest.Mocked<ScoringEventRepository>;
  let matchesService: jest.Mocked<
    Pick<MatchesService, 'findOne' | 'updateResult' | 'finishMatch'>
  >;
  let playerService: jest.Mocked<Pick<PlayerService, 'findOne'>>;
  let teamsService: jest.Mocked<Pick<TeamsService, 'findOne'>>;
  let contractService: jest.Mocked<
    Pick<PlayerContractService, 'hasActiveContractOnDate'>
  >;
  let matchNotifier: jest.Mocked<MatchNotifier>;

  const sampleMatch = {
    id: 7,
    scheduledAt: new Date('2026-06-15T01:00:00.000Z'),
    status: MatchStatus.IN_PROGRESS,
    homeScore: 1,
    awayScore: 0,
    homeTeamId: 1,
    awayTeamId: 2,
    phaseId: 1,
  };

  const samplePlayer = {
    id: 5,
    userId: 50,
    document: '1053812345',
    position: 'Delantero',
    jerseyNumber: 9,
    active: true,
  };

  const homeTeam = {
    id: 1,
    name: 'Leones FC',
    city: 'Manizales',
    contactEmail: 'leones@club.com',
    foundedYear: 2010,
    active: true,
  };

  const awayTeam = {
    id: 2,
    name: 'Tigres FC',
    city: 'Pereira',
    contactEmail: 'tigres@club.com',
    foundedYear: 2012,
    active: true,
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByMatchId: jest.fn(),
      existsByPlayerId: jest.fn(),
      existsByMatchId: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    matchesService = {
      findOne: jest.fn(),
      updateResult: jest.fn(),
      finishMatch: jest.fn(),
    };
    playerService = { findOne: jest.fn() };
    teamsService = { findOne: jest.fn() };
    contractService = { hasActiveContractOnDate: jest.fn() };
    matchNotifier = {
      notifyScoringEventCreated: jest.fn().mockResolvedValue(undefined),
      notifyMatchFinished: jest.fn().mockResolvedValue(undefined),
    };

    service = new MatchResultsService(
      repository,
      matchesService as unknown as MatchesService,
      playerService as unknown as PlayerService,
      teamsService as unknown as TeamsService,
      contractService as unknown as PlayerContractService,
      matchNotifier,
      new ScoringEventMapper(),
    );
  });

  it('should create a scoring event and notify using UTC match date', async () => {
    matchesService.findOne.mockResolvedValue(sampleMatch);
    playerService.findOne.mockResolvedValue(samplePlayer);
    teamsService.findOne.mockResolvedValue(homeTeam);
    contractService.hasActiveContractOnDate.mockResolvedValue(true);
    repository.save.mockResolvedValue(
      Object.assign(new ScoringEvent(), {
        id: 10,
        matchId: 7,
        playerId: 5,
        teamId: 1,
        minute: 30,
        type: 'GOL',
      }),
    );

    const result = await service.createScoringEvent(7, {
      playerId: 5,
      teamId: 1,
      minute: 30,
      type: 'GOL',
    });

    expect(contractService.hasActiveContractOnDate).toHaveBeenCalledWith(
      5,
      1,
      '2026-06-15',
    );
    expect(result).toEqual({
      id: 10,
      matchId: 7,
      playerId: 5,
      teamId: 1,
      minute: 30,
      type: 'GOL',
    });
    expect(matchNotifier.notifyScoringEventCreated).toHaveBeenCalledWith({
      matchId: 7,
      playerDocument: '1053812345',
      teamName: 'Leones FC',
      minute: 30,
      type: 'GOL',
    });
  });

  it('should throw INVALID_STATE when teamId does not participate in the match', async () => {
    matchesService.findOne.mockResolvedValue(sampleMatch);
    playerService.findOne.mockResolvedValue(samplePlayer);
    teamsService.findOne.mockResolvedValue({ ...homeTeam, id: 99, name: 'Otro' });

    await expect(
      service.createScoringEvent(7, {
        playerId: 5,
        teamId: 99,
        minute: 12,
        type: 'GOL',
      }),
    ).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw INVALID_STATE when player has no contract with teamId on match date', async () => {
    matchesService.findOne.mockResolvedValue(sampleMatch);
    playerService.findOne.mockResolvedValue(samplePlayer);
    teamsService.findOne.mockResolvedValue(homeTeam);
    contractService.hasActiveContractOnDate.mockResolvedValue(false);

    await expect(
      service.createScoringEvent(7, {
        playerId: 5,
        teamId: 1,
        minute: 12,
        type: 'GOL',
      }),
    ).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should finish match and send summary notification', async () => {
    matchesService.finishMatch.mockResolvedValue({
      ...sampleMatch,
      status: MatchStatus.FINISHED,
      homeScore: 2,
      awayScore: 1,
    });
    repository.findByMatchId.mockResolvedValue([]);
    teamsService.findOne
      .mockResolvedValueOnce(homeTeam)
      .mockResolvedValueOnce(awayTeam);

    const finished = await service.finishMatch(7, {
      homeScore: 2,
      awayScore: 1,
    });

    expect(finished.status).toBe(MatchStatus.FINISHED);
    expect(matchNotifier.notifyMatchFinished).toHaveBeenCalledWith({
      matchId: 7,
      homeTeamName: 'Leones FC',
      awayTeamName: 'Tigres FC',
      homeScore: 2,
      awayScore: 1,
      scoringEvents: [],
    });
  });

  it('should remove a scoring event without deleting player or match', async () => {
    const existing = Object.assign(new ScoringEvent(), { id: 10, matchId: 7 });
    repository.findById.mockResolvedValue(existing);

    await service.removeScoringEvent(10);

    expect(repository.remove).toHaveBeenCalledWith(existing);
  });

  it('should throw NOT_FOUND when removing a non-existent scoring event', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.removeScoringEvent(999)).rejects.toBeInstanceOf(
      ApplicationException,
    );
    await expect(service.removeScoringEvent(999)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
    });
  });
});
