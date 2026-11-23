import { Venue } from '../entities/venue.entity';
import { VenueMapper } from './venue.mapper';

describe('VenueMapper', () => {
  const mapper = new VenueMapper();
  const dto = {
    name: 'Valor',
    city: 'Valor',
    address: 'Valor',
    capacity: 1,
    active: true,
    parentVenueId: 1,
  };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(Venue);
    expect(entity.name).toBe('Valor');
    expect(entity.city).toBe('Valor');
    expect(entity.address).toBe('Valor');
    expect(entity.capacity).toBe(1);
    expect(entity.active).toBe(true);
    expect(entity.parentVenueId).toBe(1);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new Venue(), { id: 7 });

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
