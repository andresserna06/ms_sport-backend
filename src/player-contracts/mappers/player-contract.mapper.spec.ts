import { Player } from '../../players/entities/player.entity';
import { Team } from '../../teams/entities/team.entity';
import { PlayerContract } from '../entities/player-contract.entity';
import { PlayerContractMapper } from './player-contract.mapper';

describe('PlayerContractMapper', () => {
  let mapper: PlayerContractMapper;

  beforeEach(() => {
    mapper = new PlayerContractMapper();
  });

  it('should map CreatePlayerContractDto to PlayerContract entity', () => {
    const withEnd = mapper.toEntity(2, {
      playerId: 5,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(withEnd).toBeInstanceOf(PlayerContract);
    expect(withEnd.teamId).toBe(2);
    expect(withEnd.playerId).toBe(5);
    expect(withEnd.startDate).toBe('2026-01-01');
    expect(withEnd.endDate).toBe('2026-12-31');

    const openContract = mapper.toEntity(2, {
      playerId: 5,
      startDate: '2026-01-01',
    });
    expect(openContract.endDate).toBeNull();
  });

  it('should map PlayerContract entity to PlayerContractResponseDto', () => {
    const entity = Object.assign(new PlayerContract(), {
      id: 1,
      playerId: 5,
      teamId: 2,
      startDate: '2026-01-01',
      endDate: null,
    });

    expect(mapper.toResponseDto(entity, true)).toEqual({
      id: 1,
      playerId: 5,
      teamId: 2,
      startDate: '2026-01-01',
      endDate: null,
      current: true,
    });
  });

  it('should map team-player and player-team summary DTOs', () => {
    const entity = Object.assign(new PlayerContract(), {
      id: 3,
      playerId: 5,
      teamId: 2,
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      player: Object.assign(new Player(), {
        id: 5,
        userId: 50,
        document: '1053812345',
        position: 'Delantero',
        jerseyNumber: 9,
        active: true,
      }),
      team: Object.assign(new Team(), {
        id: 2,
        name: 'Leones FC',
        city: 'Manizales',
        active: true,
      }),
    });

    expect(mapper.toTeamPlayerDto(entity, false)).toEqual({
      id: 3,
      playerId: 5,
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      current: false,
      player: {
        id: 5,
        userId: 50,
        document: '1053812345',
        position: 'Delantero',
        jerseyNumber: 9,
        active: true,
      },
    });

    expect(mapper.toPlayerTeamDto(entity, false)).toEqual({
      id: 3,
      teamId: 2,
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      current: false,
      team: {
        id: 2,
        name: 'Leones FC',
        city: 'Manizales',
        active: true,
      },
    });
  });
});
