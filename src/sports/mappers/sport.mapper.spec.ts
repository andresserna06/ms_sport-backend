import { Sport } from '../entities/sport.entity';
import { SportMapper } from './sport.mapper';

describe('SportMapper', () => {
  const mapper = new SportMapper();

  it('creates an active root sport with the given name', () => {
    const entity = mapper.toEntity({ name: 'Fútbol' });

    expect(entity.name).toBe('Fútbol');
    expect(entity.active).toBe(true);
    expect(entity.parentSportId).toBeNull();
    expect(entity.description).toBeNull();
  });

  it('stores an empty description as null', () => {
    const entity = mapper.toEntity({ name: 'Tenis', description: '' });

    expect(entity.description).toBeNull();
  });

  it('keeps the parent id and description when provided', () => {
    const entity = mapper.toEntity({
      name: 'Fútbol sala',
      description: 'Cancha cubierta',
      parentSportId: 4,
    });

    expect(entity.parentSportId).toBe(4);
    expect(entity.description).toBe('Cancha cubierta');
  });

  it('replaces description and parent when merging (full replacement)', () => {
    const existing = Object.assign(new Sport(), {
      id: 7,
      name: 'Old',
      description: 'Old description',
      active: false,
      parentSportId: 3,
    });

    const merged = mapper.mergeEntity(existing, { name: 'New' });

    expect(merged.name).toBe('New');
    expect(merged.description).toBeNull();
    expect(merged.parentSportId).toBeNull();
    expect(merged.active).toBe(false);
    expect(merged.id).toBe(7);
  });

  it('maps a root sport to a response DTO', () => {
    const entity = Object.assign(new Sport(), {
      id: 1,
      name: 'Fútbol',
      description: null,
      active: true,
      parentSportId: null,
      parentSport: null,
      subSportsCount: 2,
    });

    expect(mapper.toResponseDto(entity)).toEqual({
      id: 1,
      name: 'Fútbol',
      description: null,
      active: true,
      parentSportId: null,
      parentSport: null,
      subSportsCount: 2,
    });
  });

  it('summarizes the parent sport as { id, name }', () => {
    const parent = Object.assign(new Sport(), {
      id: 1,
      name: 'Fútbol',
      active: true,
      subSports: [],
    });
    const entity = Object.assign(new Sport(), {
      id: 2,
      name: 'Fútbol sala',
      description: null,
      active: true,
      parentSportId: 1,
      parentSport: parent,
    });

    const dto = mapper.toResponseDto(entity);

    expect(dto.parentSport).toEqual({ id: 1, name: 'Fútbol' });
    expect(dto.subSportsCount).toBe(0);
  });

  it('maps a list of entities', () => {
    const list = [
      Object.assign(new Sport(), { id: 1, name: 'A', active: true }),
      Object.assign(new Sport(), { id: 2, name: 'B', active: true }),
    ];

    expect(mapper.toResponseDtoList(list).map((dto) => dto.id)).toEqual([1, 2]);
  });
});
