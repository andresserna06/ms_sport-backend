import { Bet } from '../entities/bet.entity';
import { BetMapper } from './bet.mapper';

describe('BetMapper', () => {
  const mapper = new BetMapper();
  const dto = { fanId: 1, matchId: 1, fanPaymentMethodId: 1, amount: 10.5 };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(Bet);
    expect(entity.fanId).toBe(1);
    expect(entity.matchId).toBe(1);
    expect(entity.fanPaymentMethodId).toBe(1);
    expect(entity.amount).toBe(10.5);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new Bet(), { id: 7 });

    const replaced = mapper.replaceEntity(existing, dto);

    expect(replaced.id).toBe(7);
  });

  it('maps an entity to the response and to a list', () => {
    const entity = Object.assign(mapper.toEntity(dto), {
      id: 3,
      placedAt: new Date('2027-01-01T10:00:00.000Z'),
    });

    const response = mapper.toResponseDto(entity);

    expect(response.id).toBe(3);
    expect(mapper.toResponseDtoList([entity])).toEqual([response]);
  });
});
