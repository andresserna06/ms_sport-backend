import { Team } from '../entities/team.entity';
import { TeamMapper } from './team.mapper';

describe('TeamMapper', () => {
  const mapper = new TeamMapper();

  it('creates an active team and lowercases the email', () => {
    const entity = mapper.toEntity({
      name: 'Atlético Nacional',
      city: 'Medellín',
      contactEmail: 'Info@Nacional.COM',
      foundedYear: 1947,
    });

    expect(entity).toMatchObject({
      name: 'Atlético Nacional',
      city: 'Medellín',
      contactEmail: 'info@nacional.com',
      foundedYear: 1947,
      active: true,
    });
  });

  it('stores a missing founded year as null', () => {
    const entity = mapper.toEntity({
      name: 'Equipo',
      city: 'Cali',
      contactEmail: 'a@b.co',
    });

    expect(entity.foundedYear).toBeNull();
  });

  it('only changes the fields that are present when merging', () => {
    const existing = Object.assign(new Team(), {
      id: 3,
      name: 'Old',
      city: 'Cali',
      contactEmail: 'old@mail.com',
      foundedYear: 1990,
      active: false,
    });

    const merged = mapper.mergeEntity(existing, { city: 'Bogotá' });

    expect(merged).toMatchObject({
      id: 3,
      name: 'Old',
      city: 'Bogotá',
      contactEmail: 'old@mail.com',
      foundedYear: 1990,
      active: false,
    });
  });

  it('lowercases the email when merging', () => {
    const existing = Object.assign(new Team(), { contactEmail: 'old@mail.com' });

    expect(
      mapper.mergeEntity(existing, { contactEmail: 'NEW@Mail.com' }).contactEmail,
    ).toBe('new@mail.com');
  });

  it('maps to a response DTO and to a list', () => {
    const entity = Object.assign(new Team(), {
      id: 1,
      name: 'A',
      city: 'B',
      contactEmail: 'c@d.co',
      foundedYear: null,
      active: true,
      teamSports: [],
    });

    const expected = {
      id: 1,
      name: 'A',
      city: 'B',
      contactEmail: 'c@d.co',
      foundedYear: null,
      active: true,
    };
    expect(mapper.toResponseDto(entity)).toEqual(expected);
    expect(mapper.toResponseDtoList([entity])).toEqual([expected]);
  });
});
