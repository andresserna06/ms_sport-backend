import { CreatePlayerDto } from '../dtos/create-player.dto';
import { UpdatePlayerDto } from '../dtos/update-player.dto';
import { Player } from '../entities/player.entity';
import { PlayerMapper } from './player.mapper';

describe('PlayerMapper', () => {
  let mapper: PlayerMapper;

  beforeEach(() => {
    mapper = new PlayerMapper();
  });

  it('should map CreatePlayerDto to Player entity with defaults and trimmed strings', () => {
    const dto: CreatePlayerDto = {
      userId: 10,
      document: '  CC-1053812345  ',
      position: '  Delantero  ',
      jerseyNumber: 9,
    };

    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(Player);
    expect(entity.userId).toBe(10);
    expect(entity.document).toBe('CC-1053812345');
    expect(entity.position).toBe('Delantero');
    expect(entity.jerseyNumber).toBe(9);
    expect(entity.active).toBe(true);
  });

  it('should map optional fields to null when omitted or null', () => {
    const dto = {
      userId: 11,
      document: '1053899999',
      position: null as unknown as string,
      jerseyNumber: null as unknown as number,
    } as CreatePlayerDto;

    const entity = mapper.toEntity(dto);

    expect(entity.position).toBeNull();
    expect(entity.jerseyNumber).toBeNull();
    expect(entity.active).toBe(true);
  });

  it('should merge UpdatePlayerDto into an existing Player entity preserving id and active', () => {
    const entity = Object.assign(new Player(), {
      id: 3,
      userId: 10,
      document: '1053812345',
      position: 'Delantero',
      jerseyNumber: 9,
      active: false,
    });

    const dto: UpdatePlayerDto = {
      userId: 10,
      document: '  1053812345  ',
      position: '  Mediocampista  ',
      jerseyNumber: 8,
    };

    const updated = mapper.mergeEntity(entity, dto);

    expect(updated.id).toBe(3);
    expect(updated.active).toBe(false);
    expect(updated.position).toBe('Mediocampista');
    expect(updated.jerseyNumber).toBe(8);
  });

  it('should map Player entity and list to PlayerResponseDto', () => {
    const p1 = Object.assign(new Player(), {
      id: 1,
      userId: 5,
      document: '1001',
      position: 'Portero',
      jerseyNumber: 1,
      active: true,
    });

    expect(mapper.toResponseDto(p1)).toEqual({
      id: 1,
      userId: 5,
      document: '1001',
      position: 'Portero',
      jerseyNumber: 1,
      active: true,
    });
    expect(mapper.toResponseDtoList([p1])).toHaveLength(1);
  });
});
