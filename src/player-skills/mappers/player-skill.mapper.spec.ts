import { Player } from '../../players/entities/player.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { PlayerSkill } from '../entities/player-skill.entity';
import { PlayerSkillMapper } from './player-skill.mapper';

describe('PlayerSkillMapper', () => {
  let mapper: PlayerSkillMapper;

  beforeEach(() => {
    mapper = new PlayerSkillMapper();
  });

  it('should map playerId, skillId and optional level to PlayerSkill entity', () => {
    const withLevel = mapper.toEntity(1, 2, { level: 4 });
    expect(withLevel).toBeInstanceOf(PlayerSkill);
    expect(withLevel.playerId).toBe(1);
    expect(withLevel.skillId).toBe(2);
    expect(withLevel.level).toBe(4);

    const withoutLevel = mapper.toEntity(1, 3);
    expect(withoutLevel.level).toBeNull();
  });

  it('should map PlayerSkill entity to PlayerSkillResponseDto with ISO date', () => {
    const date = new Date('2026-11-20T20:00:00.000Z');
    const entity = Object.assign(new PlayerSkill(), {
      id: 10,
      playerId: 1,
      skillId: 2,
      level: 5,
      assignedAt: date,
    });

    expect(mapper.toResponseDto(entity)).toEqual({
      id: 10,
      playerId: 1,
      skillId: 2,
      level: 5,
      assignedAt: '2026-11-20T20:00:00.000Z',
    });
  });

  it('should map PlayerSkill with skill relation to PlayerAssignedSkillResponseDto', () => {
    const date = new Date('2026-11-20T20:00:00.000Z');
    const entity = Object.assign(new PlayerSkill(), {
      id: 10,
      playerId: 1,
      skillId: 2,
      level: 4,
      assignedAt: date,
      skill: Object.assign(new Skill(), {
        id: 2,
        name: 'Velocidad',
        description: 'Desplazamiento rápido',
      }),
    });

    const result = mapper.toPlayerAssignedSkillDtoList([entity]);
    expect(result).toEqual([
      {
        id: 10,
        skillId: 2,
        level: 4,
        assignedAt: '2026-11-20T20:00:00.000Z',
        skill: {
          id: 2,
          name: 'Velocidad',
          description: 'Desplazamiento rápido',
        },
      },
    ]);
  });

  it('should map PlayerSkill with player relation to SkillAssignedPlayerResponseDto', () => {
    const date = new Date('2026-11-20T20:00:00.000Z');
    const entity = Object.assign(new PlayerSkill(), {
      id: 10,
      playerId: 1,
      skillId: 2,
      level: null,
      assignedAt: date,
      player: Object.assign(new Player(), {
        id: 1,
        userId: 50,
        document: '1053812345',
        position: 'Delantero',
        jerseyNumber: 9,
        active: true,
      }),
    });

    const result = mapper.toSkillAssignedPlayerDtoList([entity]);
    expect(result).toEqual([
      {
        id: 10,
        playerId: 1,
        level: null,
        assignedAt: '2026-11-20T20:00:00.000Z',
        player: {
          id: 1,
          userId: 50,
          document: '1053812345',
          position: 'Delantero',
          jerseyNumber: 9,
          active: true,
        },
      },
    ]);
  });
});
