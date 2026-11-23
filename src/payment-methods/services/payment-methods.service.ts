import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreatePaymentMethodDto } from '../dtos/create-payment-method.dto';
import { PaymentMethodResponseDto } from '../dtos/payment-method-response.dto';
import { UpdatePaymentMethodDto } from '../dtos/update-payment-method.dto';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodMapper } from '../mappers/payment-method.mapper';
import {
  PAYMENT_METHODS_REPOSITORY,
  type PaymentMethodRepository,
} from '../repositories/payment-method.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'el método de pago',
  duplicate: 'Ya existe un método de pago con ese nombre',
  references: {},
};

@Injectable()
export class PaymentMethodsService {
  constructor(
    @Inject(PAYMENT_METHODS_REPOSITORY)
    private readonly repository: PaymentMethodRepository,
    private readonly mapper: PaymentMethodMapper,
  ) {}

  async create(dto: CreatePaymentMethodDto): Promise<PaymentMethodResponseDto> {
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<PaymentMethodResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<PaymentMethodResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(
    id: number,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const entity = await this.getOrFail(id);
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

  private async getOrFail(id: number): Promise<PaymentMethod> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el método de pago con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: PaymentMethod): Promise<PaymentMethod> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
