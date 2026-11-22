import { Sport } from '../../sports/entities/sport.entity';
import { Tournament } from '../entities/tournament.entity';
import { TournamentMapper } from './tournament.mapper';

describe('TournamentMapper', () => {
  const mapper = new TournamentMapper();
  const dto = {
    name: 'Copa',
    sportId: 5,
    startDate: '2027-03-01',
    enrollmentDeadline: '2027-02-01',
  };

  it('creates an active tournament from the DTO', () => {
    expect(mapper.toEntity(dto)).toMatchObject({ ...dto, active: true });
  });

  it('replaces every editable field and keeps id and active', () => {
    const existing = Object.assign(new Tournament(), {
      id: 3,
      name: 'Old',
      sportId: 1,
      startDate: '2026-01-02',
      enrollmentDeadline: '2026-01-01',
      active: false,
    });

    expect(mapper.replaceEntity(existing, dto)).toMatchObject({
      id: 3,
      ...dto,
      active: false,
    });
  });

  it('maps to a response with the sport summary and to a list', () => {
    const entity = Object.assign(new Tournament(), {
      id: 1,
      ...dto,
      active: true,
      sport: Object.assign(new Sport(), {
        id: 5,
        name: 'Fútbol',
        active: true,
      }),
    });
    const expected = {
      id: 1,
      name: 'Copa',
      sport: { id: 5, name: 'Fútbol' },
      startDate: '2027-03-01',
      enrollmentDeadline: '2027-02-01',
      active: true,
    };

    expect(mapper.toResponseDto(entity)).toEqual(expected);
    expect(mapper.toResponseDtoList([entity])).toEqual([expected]);
  });
});

