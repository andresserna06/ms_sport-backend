import { Ball } from '../entities/ball.entity';
import { BallMapper } from './ball.mapper';

describe('BallMapper', () => {
  const mapper = new BallMapper();
  const dto = { matchId: 1, serialNumber: 'Valor' };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(Ball);
    expect(entity.matchId).toBe(1);
    expect(entity.serialNumber).toBe('Valor');
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new Ball(), { id: 7 });

    const replaced = mapper.replaceEntity(existing, dto);

    expect(replaced.id).toBe(7);
  });

  it('maps an entity to the response and to a list', () => {
    const entity = Object.assign(mapper.toEntity(dto), { id: 3 });

    const response = mapper.toResponseDto(entity);

    expect(response.id).toBe(3);
    expect(mapper.toResponseDtoList([entity])).toEqual([response]);
  });
});
