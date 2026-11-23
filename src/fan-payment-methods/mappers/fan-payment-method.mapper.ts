import { Injectable } from '@nestjs/common';
import { CreateFanPaymentMethodDto } from '../dtos/create-fan-payment-method.dto';
import { FanPaymentMethodResponseDto } from '../dtos/fan-payment-method-response.dto';
import { UpdateFanPaymentMethodDto } from '../dtos/update-fan-payment-method.dto';
import { FanPaymentMethod } from '../entities/fan-payment-method.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class FanPaymentMethodMapper {
  toEntity(dto: CreateFanPaymentMethodDto): FanPaymentMethod {
    const entity = new FanPaymentMethod();
    entity.fanId = dto.fanId;
    entity.paymentMethodId = dto.paymentMethodId;
    entity.alias = dto.alias ?? null;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(
    entity: FanPaymentMethod,
    dto: UpdateFanPaymentMethodDto,
  ): FanPaymentMethod {
    entity.fanId = dto.fanId;
    entity.paymentMethodId = dto.paymentMethodId;
    entity.alias = dto.alias ?? null;
    return entity;
  }

  toResponseDto(entity: FanPaymentMethod): FanPaymentMethodResponseDto {
    return {
      id: entity.id,
      fanId: entity.fanId,
      paymentMethodId: entity.paymentMethodId,
      alias: entity.alias,
    };
  }

  toResponseDtoList(
    entities: FanPaymentMethod[],
  ): FanPaymentMethodResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
