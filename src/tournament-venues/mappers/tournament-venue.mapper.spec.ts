import { TournamentVenue } from '../entities/tournament-venue.entity';
import { TournamentVenueMapper } from './tournament-venue.mapper';

describe('TournamentVenueMapper', () => {
  const mapper = new TournamentVenueMapper();
  const dto = { tournamentId: 1, venueId: 1 };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(TournamentVenue);
    expect(entity.tournamentId).toBe(1);
    expect(entity.venueId).toBe(1);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new TournamentVenue(), { id: 7 });

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
