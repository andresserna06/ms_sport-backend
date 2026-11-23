import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { FansService } from '../../fans/services/fans.service';
import { FanPaymentMethodsService } from '../../fan-payment-methods/services/fan-payment-methods.service';
import { CreateBetDto } from '../dtos/create-bet.dto';
import { BetResponseDto } from '../dtos/bet-response.dto';
import { UpdateBetDto } from '../dtos/update-bet.dto';
import { Bet } from '../entities/bet.entity';
import { BetMapper } from '../mappers/bet.mapper';
import {
  BETS_REPOSITORY,
  type BetRepository,
} from '../repositories/bet.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'la apuesta',
  duplicate: 'Ya existe la apuesta con esos datos',
  references: {
    FK_bets_fan: 'el aficionado',
    FK_bets_match: 'el partido',
    FK_bets_fan_payment_method: 'el método de pago del aficionado',
  },
};

@Injectable()
export class BetsService {
  constructor(
    @Inject(BETS_REPOSITORY) private readonly repository: BetRepository,
    private readonly mapper: BetMapper,
    private readonly fanPaymentMethodsService: FanPaymentMethodsService,
    private readonly fansService: FansService,
  ) {}

  async create(dto: CreateBetDto): Promise<BetResponseDto> {
    await this.assertFanIsActive(dto.fanId);
    await this.assertPaymentMethodBelongsToFan(dto);
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<BetResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<BetResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(id: number, dto: UpdateBetDto): Promise<BetResponseDto> {
    const entity = await this.getOrFail(id);
    if (entity.fanId !== dto.fanId) await this.assertFanIsActive(dto.fanId);
    await this.assertPaymentMethodBelongsToFan(dto);
    const saved = await this.save(this.mapper.replaceEntity(entity, dto));
    return this.mapper.toResponseDto(saved);
  }

  // (Propuesta) An inactive fan cannot place new bets.
  private async assertFanIsActive(fanId: number): Promise<void> {
    const fan = await this.fansService.findOne(fanId);
    if (!fan.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El aficionado ${fanId} está inactivo`,
      );
    }
  }

  // Class diagram: Bet (n) - FanPaymentMethod (1). The payment method used must
  // be one registered by the same fan who places the bet.
  private async assertPaymentMethodBelongsToFan(
    dto: CreateBetDto,
  ): Promise<void> {
    const fanPaymentMethod = await this.fanPaymentMethodsService.findOne(
      dto.fanPaymentMethodId,
    );
    if (fanPaymentMethod.fanId !== dto.fanId) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        'El método de pago no pertenece al aficionado que realiza la apuesta',
      );
    }
  }

  async remove(id: number): Promise<void> {
    const entity = await this.getOrFail(id);
    try {
      await this.repository.remove(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }

  private async getOrFail(id: number): Promise<Bet> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la apuesta con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: Bet): Promise<Bet> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
