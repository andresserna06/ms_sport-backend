import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { PlayerContractService } from '../../player-contracts/services/player-contract.service';
import { PlayerSkillService } from '../../player-skills/services/player-skill.service';
import { PlayerService } from '../../players/services/player.service';
import { PlayerProfileMapper } from '../mappers/player-profile.mapper';
import { PlayerProfileService } from './player-profile.service';

describe('PlayerProfileService', () => {
  let service: PlayerProfileService;
  let playerService: jest.Mocked<Pick<PlayerService, 'findOne'>>;
  let contractService: jest.Mocked<
    Pick<PlayerContractService, 'findTeamsByPlayer'>
  >;
  let playerSkillService: jest.Mocked<
    Pick<PlayerSkillService, 'findSkillsByPlayer'>
  >;
  let mapper: PlayerProfileMapper;

  const samplePlayer = {
    id: 1,
    userId: 10,
    document: '1053812345',
    position: 'Delantero',
    jerseyNumber: 9,
    active: true,
  };

  beforeEach(() => {
    playerService = { findOne: jest.fn() };
    contractService = { findTeamsByPlayer: jest.fn() };
    playerSkillService = { findSkillsByPlayer: jest.fn() };
    mapper = new PlayerProfileMapper();
    service = new PlayerProfileService(
      playerService as unknown as PlayerService,
      contractService as unknown as PlayerContractService,
      playerSkillService as unknown as PlayerSkillService,
      mapper,
    );
  });

  it('should return explicit messages when player has no teams and no skills', async () => {
    playerService.findOne.mockResolvedValue(samplePlayer);
    contractService.findTeamsByPlayer.mockResolvedValue([]);
    playerSkillService.findSkillsByPlayer.mockResolvedValue([]);

    const profile = await service.getProfile(1);

    expect(profile).toEqual({
      player: samplePlayer,
      teams: [],
      teamsMessage: 'El jugador no tiene equipos asociados',
      skills: [],
      skillsMessage: 'El jugador no tiene habilidades registradas',
    });
  });

  it('should return teams, skills and null messages when both exist', async () => {
    playerService.findOne.mockResolvedValue({ ...samplePlayer, active: false });
    contractService.findTeamsByPlayer.mockResolvedValue([
      {
        id: 1,
        teamId: 2,
        startDate: '2025-01-01',
        endDate: null,
        current: true,
        team: { id: 2, name: 'Leones FC', city: 'Manizales', active: true },
      },
    ]);
    playerSkillService.findSkillsByPlayer.mockResolvedValue([
      {
        id: 3,
        skillId: 5,
        level: 4,
        assignedAt: '2026-11-20T20:00:00.000Z',
        skill: { id: 5, name: 'Velocidad', description: 'Rápido' },
      },
    ]);

    const profile = await service.getProfile(1);

    expect(profile.player.active).toBe(false);
    expect(profile.teams).toHaveLength(1);
    expect(profile.teamsMessage).toBeNull();
    expect(profile.skills).toHaveLength(1);
    expect(profile.skillsMessage).toBeNull();
  });

  it('should propagate NOT_FOUND when player does not exist', async () => {
    playerService.findOne.mockRejectedValue(
      new ApplicationException(
        ErrorCase.NOT_FOUND,
        'No existe un jugador con el id 999',
      ),
    );

    await expect(service.getProfile(999)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
    });
    expect(contractService.findTeamsByPlayer).not.toHaveBeenCalled();
    expect(playerSkillService.findSkillsByPlayer).not.toHaveBeenCalled();
  });
});
