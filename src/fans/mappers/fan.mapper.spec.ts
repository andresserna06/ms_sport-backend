import { Fan } from '../entities/fan.entity';
import { FanMapper } from './fan.mapper';

describe('FanMapper', () => {
  const mapper = new FanMapper();
  const dto = { name: 'Valor', email: 'a@b.co', active: true };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(Fan);
    expect(entity.name).toBe('Valor');
    expect(entity.active).toBe(true);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new Fan(), { id: 7 });

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
