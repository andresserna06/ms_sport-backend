import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { Player } from '../../players/entities/player.entity';
import { PlayerService } from '../../players/services/player.service';
import { Skill } from '../../skills/entities/skill.entity';
import { SkillService } from '../../skills/services/skill.service';
import { PlayerSkill } from '../entities/player-skill.entity';
import { PlayerSkillMapper } from '../mappers/player-skill.mapper';
import { PlayerSkillRepository } from '../repositories/player-skill.repository';
import { PlayerSkillService } from './player-skill.service';

describe('PlayerSkillService', () => {
  let service: PlayerSkillService;
  let repository: jest.Mocked<PlayerSkillRepository>;
  let playerService: jest.Mocked<Pick<PlayerService, 'findOne'>>;
  let skillService: jest.Mocked<Pick<SkillService, 'findOne'>>;
  let mapper: PlayerSkillMapper;

  beforeEach(() => {
    repository = {
      findByPlayerAndSkill: jest.fn(),
      findSkillsByPlayerId: jest.fn(),
      findPlayersBySkillId: jest.fn(),
      existsByPlayerId: jest.fn(),
      existsBySkillId: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    playerService = { findOne: jest.fn() };
    skillService = { findOne: jest.fn() };
    mapper = new PlayerSkillMapper();
    service = new PlayerSkillService(
      repository,
      playerService as unknown as PlayerService,
      skillService as unknown as SkillService,
      mapper,
    );
  });

  it('should assign a skill to an active player', async () => {
    const date = new Date('2026-11-20T20:00:00.000Z');
    playerService.findOne.mockResolvedValue({
      id: 1,
      userId: 10,
      document: '1001',
      position: 'Delantero',
      jerseyNumber: 9,
      active: true,
    });
    skillService.findOne.mockResolvedValue({
      id: 2,
      name: 'Velocidad',
      description: 'Desplazamiento rápido',
    });
    repository.findByPlayerAndSkill.mockResolvedValue(null);
    repository.save.mockResolvedValue(
      Object.assign(new PlayerSkill(), {
        id: 5,
        playerId: 1,
        skillId: 2,
        level: 4,
        assignedAt: date,
      }),
    );

    const result = await service.assign(1, 2, { level: 4 });

    expect(result).toEqual({
      id: 5,
      playerId: 1,
      skillId: 2,
      level: 4,
      assignedAt: '2026-11-20T20:00:00.000Z',
    });
  });

  it('should throw INVALID_STATE when assigning an existing skill to an inactive player', async () => {
    playerService.findOne.mockResolvedValue({
      id: 1,
      userId: 10,
      document: '1001',
      position: null,
      jerseyNumber: null,
      active: false,
    });
    skillService.findOne.mockResolvedValue({
      id: 2,
      name: 'Velocidad',
      description: 'Desc',
    });

    await expect(service.assign(1, 2)).rejects.toMatchObject({
      errorCase: ErrorCase.INVALID_STATE,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw NOT_FOUND before INVALID_STATE when skill does not exist for an inactive player', async () => {
    playerService.findOne.mockResolvedValue({
      id: 1,
      userId: 10,
      document: '1001',
      position: null,
      jerseyNumber: null,
      active: false,
    });
    skillService.findOne.mockRejectedValue(
      new ApplicationException(
        ErrorCase.NOT_FOUND,
        'No existe una habilidad con el id 999',
      ),
    );

    await expect(service.assign(1, 999)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw ALREADY_EXISTS when assigning a duplicate skill to a player', async () => {
    playerService.findOne.mockResolvedValue({
      id: 1,
      userId: 10,
      document: '1001',
      position: null,
      jerseyNumber: null,
      active: true,
    });
    skillService.findOne.mockResolvedValue({
      id: 2,
      name: 'Velocidad',
      description: 'Desc',
    });
    repository.findByPlayerAndSkill.mockResolvedValue(new PlayerSkill());

    await expect(service.assign(1, 2)).rejects.toMatchObject({
      errorCase: ErrorCase.ALREADY_EXISTS,
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should remove an existing association without deleting player or skill', async () => {
    const existing = Object.assign(new PlayerSkill(), {
      id: 5,
      playerId: 1,
      skillId: 2,
    });
    playerService.findOne.mockResolvedValue({
      id: 1,
      userId: 10,
      document: '1001',
      position: null,
      jerseyNumber: null,
      active: true,
    });
    skillService.findOne.mockResolvedValue({
      id: 2,
      name: 'Velocidad',
      description: 'Desc',
    });
    repository.findByPlayerAndSkill.mockResolvedValue(existing);

    await service.remove(1, 2);

    expect(repository.remove).toHaveBeenCalledWith(existing);
  });

  it('should throw NOT_FOUND when removing a non-existent association', async () => {
    playerService.findOne.mockResolvedValue({
      id: 1,
      userId: 10,
      document: '1001',
      position: null,
      jerseyNumber: null,
      active: true,
    });
    skillService.findOne.mockResolvedValue({
      id: 2,
      name: 'Velocidad',
      description: 'Desc',
    });
    repository.findByPlayerAndSkill.mockResolvedValue(null);

    await expect(service.remove(1, 2)).rejects.toBeInstanceOf(
      ApplicationException,
    );
    await expect(service.remove(1, 2)).rejects.toMatchObject({
      errorCase: ErrorCase.NOT_FOUND,
    });
  });

  it('should list skills assigned to a player and players assigned to a skill', async () => {
    const date = new Date('2026-11-20T20:00:00.000Z');
    playerService.findOne.mockResolvedValue({
      id: 1,
      userId: 10,
      document: '1001',
      position: 'Delantero',
      jerseyNumber: 9,
      active: true,
    });
    skillService.findOne.mockResolvedValue({
      id: 2,
      name: 'Velocidad',
      description: 'Desc',
    });

    repository.findSkillsByPlayerId.mockResolvedValue([
      Object.assign(new PlayerSkill(), {
        id: 5,
        playerId: 1,
        skillId: 2,
        level: 4,
        assignedAt: date,
        skill: Object.assign(new Skill(), {
          id: 2,
          name: 'Velocidad',
          description: 'Desc',
        }),
      }),
    ]);

    repository.findPlayersBySkillId.mockResolvedValue([
      Object.assign(new PlayerSkill(), {
        id: 5,
        playerId: 1,
        skillId: 2,
        level: 4,
        assignedAt: date,
        player: Object.assign(new Player(), {
          id: 1,
          userId: 10,
          document: '1001',
          position: 'Delantero',
          jerseyNumber: 9,
          active: true,
        }),
      }),
    ]);

    const skills = await service.findSkillsByPlayer(1);
    expect(skills).toHaveLength(1);
    expect(skills[0].skill.name).toBe('Velocidad');

    const players = await service.findPlayersBySkill(2);
    expect(players).toHaveLength(1);
    expect(players[0].player.document).toBe('1001');
  });
});
