import { Ticket } from '../entities/ticket.entity';
import { TicketMapper } from './ticket.mapper';

describe('TicketMapper', () => {
  const mapper = new TicketMapper();
  const dto = { fanId: 1, matchId: 1, seatingZoneId: 1, price: 10.5 };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(Ticket);
    expect(entity.fanId).toBe(1);
    expect(entity.matchId).toBe(1);
    expect(entity.seatingZoneId).toBe(1);
    expect(entity.price).toBe(10.5);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new Ticket(), { id: 7 });

    const replaced = mapper.replaceEntity(existing, dto);

    expect(replaced.id).toBe(7);
  });

  it('maps an entity to the response and to a list', () => {
    const entity = Object.assign(mapper.toEntity(dto), {
      id: 3,
      purchasedAt: new Date('2027-01-01T10:00:00.000Z'),
    });

    const response = mapper.toResponseDto(entity);

    expect(response.id).toBe(3);
    expect(mapper.toResponseDtoList([entity])).toEqual([response]);
  });
});
