import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodMapper } from './payment-method.mapper';

describe('PaymentMethodMapper', () => {
  const mapper = new PaymentMethodMapper();
  const dto = { name: 'Valor', active: true };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(PaymentMethod);
    expect(entity.name).toBe('Valor');
    expect(entity.active).toBe(true);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new PaymentMethod(), { id: 7 });

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
