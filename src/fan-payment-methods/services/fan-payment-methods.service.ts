import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { FansService } from '../../fans/services/fans.service';
import { PaymentMethodsService } from '../../payment-methods/services/payment-methods.service';
import { CreateFanPaymentMethodDto } from '../dtos/create-fan-payment-method.dto';
import { FanPaymentMethodResponseDto } from '../dtos/fan-payment-method-response.dto';
import { UpdateFanPaymentMethodDto } from '../dtos/update-fan-payment-method.dto';
import { FanPaymentMethod } from '../entities/fan-payment-method.entity';
import { FanPaymentMethodMapper } from '../mappers/fan-payment-method.mapper';
import {
  FAN_PAYMENT_METHODS_REPOSITORY,
  type FanPaymentMethodRepository,
} from '../repositories/fan-payment-method.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'el método de pago del aficionado',
  duplicate: 'El aficionado ya tiene registrado ese método de pago',
  references: {
    FK_fan_payment_methods_fan: 'el aficionado',
    FK_fan_payment_methods_payment_method: 'el método de pago',
  },
};

@Injectable()
export class FanPaymentMethodsService {
  constructor(
    @Inject(FAN_PAYMENT_METHODS_REPOSITORY)
    private readonly repository: FanPaymentMethodRepository,
    private readonly mapper: FanPaymentMethodMapper,
    private readonly fansService: FansService,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  async create(
    dto: CreateFanPaymentMethodDto,
  ): Promise<FanPaymentMethodResponseDto> {
    await this.assertFanAndMethodAreActive(dto, true, true);
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<FanPaymentMethodResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<FanPaymentMethodResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(
    id: number,
    dto: UpdateFanPaymentMethodDto,
  ): Promise<FanPaymentMethodResponseDto> {
    const entity = await this.getOrFail(id);
    await this.assertFanAndMethodAreActive(
      dto,
      entity.fanId !== dto.fanId,
      entity.paymentMethodId !== dto.paymentMethodId,
    );
    const saved = await this.save(this.mapper.replaceEntity(entity, dto));
    return this.mapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.getOrFail(id);
    try {
      await this.repository.remove(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }

  // (Propuesta) Inactive fans and inactive payment methods cannot get new associations.
  private async assertFanAndMethodAreActive(
    dto: CreateFanPaymentMethodDto,
    checkFan: boolean,
    checkMethod: boolean,
  ): Promise<void> {
    if (checkFan) {
      const fan = await this.fansService.findOne(dto.fanId);
      if (!fan.active) {
        throw new ApplicationException(
          ErrorCase.INVALID_STATE,
          `El aficionado ${dto.fanId} está inactivo`,
        );
      }
    }
    if (checkMethod) {
      const method = await this.paymentMethodsService.findOne(
        dto.paymentMethodId,
      );
      if (!method.active) {
        throw new ApplicationException(
          ErrorCase.INVALID_STATE,
          `El método de pago ${dto.paymentMethodId} está inactivo`,
        );
      }
    }
  }

  private async getOrFail(id: number): Promise<FanPaymentMethod> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el método de pago del aficionado con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: FanPaymentMethod): Promise<FanPaymentMethod> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
