import { Fan } from '../entities/fan.entity';
import { FanMapper } from './fan.mapper';

describe('FanMapper', () => {
  const mapper = new FanMapper();
  const dto = { userId: 10, active: true };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(Fan);
    expect(entity.userId).toBe(10);
    expect(entity.active).toBe(true);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new Fan(), { id: 7 });

    const replaced = mapper.replaceEntity(existing, dto);

    expect(replaced.id).toBe(7);
    expect(replaced.userId).toBe(10);
  });

  it('maps an entity to the response and to a list', () => {
    const entity = Object.assign(mapper.toEntity(dto), { id: 3 });

    const response = mapper.toResponseDto(entity);

    expect(response).toEqual({ id: 3, userId: 10, active: true });
    expect(mapper.toResponseDtoList([entity])).toEqual([response]);
  });
});
