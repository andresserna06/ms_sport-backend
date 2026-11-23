import { SpatialPosition } from '../entities/spatial-position.entity';
import { SpatialPositionMapper } from './spatial-position.mapper';

describe('SpatialPositionMapper', () => {
  const mapper = new SpatialPositionMapper();
  const dto = {
    ballId: 1,
    playerId: 1,
    x: 10.5,
    y: 10.5,
    recordedAt: '2027-01-01T10:00:00.000Z',
  };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(SpatialPosition);
    expect(entity.ballId).toBe(1);
    expect(entity.playerId).toBe(1);
    expect(entity.x).toBe(10.5);
    expect(entity.y).toBe(10.5);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new SpatialPosition(), { id: 7 });

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
