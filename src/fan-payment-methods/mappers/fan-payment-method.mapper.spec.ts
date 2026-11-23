import { FanPaymentMethod } from '../entities/fan-payment-method.entity';
import { FanPaymentMethodMapper } from './fan-payment-method.mapper';

describe('FanPaymentMethodMapper', () => {
  const mapper = new FanPaymentMethodMapper();
  const dto = { fanId: 1, paymentMethodId: 1, alias: 'Valor' };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(FanPaymentMethod);
    expect(entity.fanId).toBe(1);
    expect(entity.paymentMethodId).toBe(1);
    expect(entity.alias).toBe('Valor');
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new FanPaymentMethod(), { id: 7 });

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
