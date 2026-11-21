import { Player } from '../../players/entities/player.entity';
import { Team } from '../../teams/entities/team.entity';
import { ScoringEvent } from '../entities/scoring-event.entity';
import { ScoringEventMapper } from './scoring-event.mapper';

describe('ScoringEventMapper', () => {
  let mapper: ScoringEventMapper;

  beforeEach(() => {
    mapper = new ScoringEventMapper();
  });

  it('should map CreateScoringEventDto to ScoringEvent entity trimming type', () => {
    const entity = mapper.toEntity(7, {
      playerId: 5,
      teamId: 2,
      minute: 23,
      type: '  GOL  ',
    });

    expect(entity).toBeInstanceOf(ScoringEvent);
    expect(entity.matchId).toBe(7);
    expect(entity.playerId).toBe(5);
    expect(entity.teamId).toBe(2);
    expect(entity.minute).toBe(23);
    expect(entity.type).toBe('GOL');
  });

  it('should map ScoringEvent with relations to ScoringEventResponseDto', () => {
    const entity = Object.assign(new ScoringEvent(), {
      id: 1,
      matchId: 7,
      playerId: 5,
      teamId: 2,
      minute: 23,
      type: 'GOL',
      player: Object.assign(new Player(), {
        id: 5,
        document: '1053812345',
        position: 'Delantero',
        jerseyNumber: 9,
      }),
      team: Object.assign(new Team(), {
        id: 2,
        name: 'Leones FC',
      }),
    });

    expect(mapper.toResponseDto(entity)).toEqual({
      id: 1,
      matchId: 7,
      playerId: 5,
      teamId: 2,
      minute: 23,
      type: 'GOL',
      player: {
        id: 5,
        document: '1053812345',
        position: 'Delantero',
        jerseyNumber: 9,
      },
      team: {
        id: 2,
        name: 'Leones FC',
      },
    });
  });
});
