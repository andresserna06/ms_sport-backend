import { SeatingZone } from '../entities/seating-zone.entity';
import { SeatingZoneMapper } from './seating-zone.mapper';

describe('SeatingZoneMapper', () => {
  const mapper = new SeatingZoneMapper();
  const dto = { venueId: 1, name: 'Valor', capacity: 1, price: 10.5 };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(SeatingZone);
    expect(entity.venueId).toBe(1);
    expect(entity.name).toBe('Valor');
    expect(entity.capacity).toBe(1);
    expect(entity.price).toBe(10.5);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new SeatingZone(), { id: 7 });

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
