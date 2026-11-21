import { PlayerProfileMapper } from './player-profile.mapper';

describe('PlayerProfileMapper', () => {
  let mapper: PlayerProfileMapper;

  beforeEach(() => {
    mapper = new PlayerProfileMapper();
  });

  it('should assemble PlayerProfileResponseDto with teams, skills and messages', () => {
    const player = {
      id: 1,
      userId: 10,
      document: '1053812345',
      position: 'Delantero',
      jerseyNumber: 9,
      active: true,
    };

    const result = mapper.toResponseDto(
      player,
      [],
      'El jugador no tiene equipos asociados',
      [],
      'El jugador no tiene habilidades registradas',
    );

    expect(result).toEqual({
      player,
      teams: [],
      teamsMessage: 'El jugador no tiene equipos asociados',
      skills: [],
      skillsMessage: 'El jugador no tiene habilidades registradas',
    });
  });
});
