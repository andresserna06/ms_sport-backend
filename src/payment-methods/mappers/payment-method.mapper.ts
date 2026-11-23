import { Injectable } from '@nestjs/common';
import { CreatePaymentMethodDto } from '../dtos/create-payment-method.dto';
import { PaymentMethodResponseDto } from '../dtos/payment-method-response.dto';
import { UpdatePaymentMethodDto } from '../dtos/update-payment-method.dto';
import { PaymentMethod } from '../entities/payment-method.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class PaymentMethodMapper {
  toEntity(dto: CreatePaymentMethodDto): PaymentMethod {
    const entity = new PaymentMethod();
    entity.name = dto.name;
    entity.active = dto.active ?? true;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(
    entity: PaymentMethod,
    dto: UpdatePaymentMethodDto,
  ): PaymentMethod {
    entity.name = dto.name;
    entity.active = dto.active ?? entity.active;
    return entity;
  }

  toResponseDto(entity: PaymentMethod): PaymentMethodResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      active: entity.active,
    };
  }

  toResponseDtoList(entities: PaymentMethod[]): PaymentMethodResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
