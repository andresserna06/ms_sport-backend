import { NotFoundException } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { Player } from '../../players/entities/player.entity';
import { PlayerService } from '../../players/services/player.service';
import { Team } from '../../teams/entities/team.entity';
import { TeamsService } from '../../teams/teams.service';
import { PlayerContract } from '../entities/player-contract.entity';
import { PlayerContractMapper } from '../mappers/player-contract.mapper';
import { PlayerContractRepository } from '../repositories/player-contract.repository';
import { PlayerContractService } from './player-contract.service';

describe('PlayerContractService', () => {
  let service: PlayerContractService;
  let repository: jest.Mocked<PlayerContractRepository>;
  let playerService: jest.Mocked<Pick<PlayerService, 'findOne'>>;
  let teamsService: jest.Mocked<Pick<TeamsService, 'findOne'>>;
  let mapper: PlayerContractMapper;

  const activeTeam = {
    id: 2,
    name: 'Leones FC',
    city: 'Manizales',
    contactEmail: 'leones@test.com',
    foundedYear: 2010,
    active: true,
  };

  const activePlayer = {
    id: 5,
    userId: 50,
    document: '1053812345',
    position: 'Delantero',
    jerseyNumber: 9,
    active: true,
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findByPlayerAndTeam: jest.fn(),
      findByTeamId: jest.fn(),
      findByPlayerId: jest.fn(),
      existsByPlayerId: jest.fn(),
      save: jest.fn(),
    };
    playerService = { findOne: jest.fn() };
    teamsService = { findOne: jest.fn() };
    mapper = new PlayerContractMapper();
    service = new PlayerContractService(
      repository,
      playerService as unknown as PlayerService,
      teamsService as unknown as TeamsService,
      mapper,
    );
  });

  it('should create a contract when team and player are active and periods do not overlap', async () => {
    teamsService.findOne.mockResolvedValue(activeTeam);
    playerService.findOne.mockResolvedValue(activePlayer);
    repository.findByPlayerAndTeam.mockResolvedValue([
      Object.assign(new PlayerContract(), {
        id: 1,
        playerId: 5,
        teamId: 2,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }),
    ]);
    repository.save.mockResolvedValue(
      Object.assign(new PlayerContract(), {
        id: 2,
        playerId: 5,
        teamId: 2,
        startDate: '2025-01-01',
        endDate: null,
      }),
    );

    const result = await service.create(2, {
      playerId: 5,
      startDate: '2025-01-01',
    });

    expect(result).toEqual({
      id: 2,
      playerId: 5,
      teamId: 2,
      startDate: '2025-01-01',
      endDate: null,
      current: true,
    });
  });

  it('should throw INVALID_OPERATION when endDate is before startDate', async () => {
    teamsService.findOne.mockResolvedValue(activeTeam);
    playerService.findOne.mockResolvedValue(activePlayer);

    await expect(
      service.create(2, {
        playerId: 5,
        startDate: '2026-06-01',
        endDate: '2026-05-01',
      }),
    ).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_OPERATION,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw ALREADY_EXISTS when contract period overlaps an existing contract', async () => {
    teamsService.findOne.mockResolvedValue(activeTeam);
    playerService.findOne.mockResolvedValue(activePlayer);
    repository.findByPlayerAndTeam.mockResolvedValue([
      Object.assign(new PlayerContract(), {
        id: 1,
        playerId: 5,
        teamId: 2,
        startDate: '2026-01-01',
        endDate: '2026-06-30',
      }),
    ]);

    await expect(
      service.create(2, {
        playerId: 5,
        startDate: '2026-06-15',
        endDate: '2026-12-31',
      }),
    ).rejects.toMatchObject({
      errorCase: ErrorCase.ALREADY_EXISTS,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should translate NotFoundException from TeamsService to ApplicationException NOT_FOUND', async () => {
    teamsService.findOne.mockRejectedValue(
      new NotFoundException('Team with id 999 not found'),
    );

    await expect(
      service.create(999, { playerId: 5, startDate: '2026-01-01' }),
    ).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
    });
  });

  it('should throw INVALID_STATE when team or player is inactive', async () => {
    teamsService.findOne.mockResolvedValue({ ...activeTeam, active: false });
    playerService.findOne.mockResolvedValue(activePlayer);

    await expect(
      service.create(2, { playerId: 5, startDate: '2026-01-01' }),
    ).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
  });

  it('should end an active contract setting endDate to today and current to false', async () => {
    const open = Object.assign(new PlayerContract(), {
      id: 10,
      playerId: 5,
      teamId: 2,
      startDate: '2025-01-01',
      endDate: null,
    });
    repository.findById.mockResolvedValue(open);
    repository.save.mockImplementation(async (c) => c);

    const ended = await service.endContract(10);

    expect(ended.current).toBe(false);
    expect(ended.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should throw INVALID_STATE when ending an already ended or future contract', async () => {
    repository.findById.mockResolvedValue(
      Object.assign(new PlayerContract(), {
        id: 11,
        playerId: 5,
        teamId: 2,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }),
    );
    await expect(service.endContract(11)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });

    repository.findById.mockResolvedValue(
      Object.assign(new PlayerContract(), {
        id: 12,
        playerId: 5,
        teamId: 2,
        startDate: '2099-01-01',
        endDate: null,
      }),
    );
    await expect(service.endContract(12)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
  });

  it('should throw NOT_FOUND when ending a non-existent contract', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.endContract(999)).rejects.toBeInstanceOf(
      ApplicationException,
    );
    await expect(service.endContract(999)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
    });
  });

  it('should filter team players and player teams by current flag', async () => {
    teamsService.findOne.mockResolvedValue(activeTeam);
    playerService.findOne.mockResolvedValue(activePlayer);

    const pastContract = Object.assign(new PlayerContract(), {
      id: 1,
      playerId: 5,
      teamId: 2,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      player: Object.assign(new Player(), activePlayer),
      team: Object.assign(new Team(), activeTeam),
    });
    const currentContract = Object.assign(new PlayerContract(), {
      id: 2,
      playerId: 5,
      teamId: 2,
      startDate: '2025-01-01',
      endDate: null,
      player: Object.assign(new Player(), activePlayer),
      team: Object.assign(new Team(), activeTeam),
    });

    repository.findByTeamId.mockResolvedValue([pastContract, currentContract]);
    repository.findByPlayerId.mockResolvedValue([pastContract, currentContract]);

    const onlyCurrentPlayers = await service.findPlayersByTeam(2, {
      current: true,
    });
    expect(onlyCurrentPlayers).toHaveLength(1);
    expect(onlyCurrentPlayers[0].id).toBe(2);

    const allTeamsHistory = await service.findTeamsByPlayer(5, {});
    expect(allTeamsHistory).toHaveLength(2);
    expect(allTeamsHistory[0].current).toBe(false);
    expect(allTeamsHistory[1].current).toBe(true);
  });
});
