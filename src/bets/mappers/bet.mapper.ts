import { Injectable } from '@nestjs/common';
import { CreateBetDto } from '../dtos/create-bet.dto';
import { BetResponseDto } from '../dtos/bet-response.dto';
import { UpdateBetDto } from '../dtos/update-bet.dto';
import { Bet } from '../entities/bet.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class BetMapper {
  toEntity(dto: CreateBetDto): Bet {
    const entity = new Bet();
    entity.fanId = dto.fanId;
    entity.matchId = dto.matchId;
    entity.fanPaymentMethodId = dto.fanPaymentMethodId;
    entity.amount = dto.amount;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(entity: Bet, dto: UpdateBetDto): Bet {
    entity.fanId = dto.fanId;
    entity.matchId = dto.matchId;
    entity.fanPaymentMethodId = dto.fanPaymentMethodId;
    entity.amount = dto.amount;
    return entity;
  }

  toResponseDto(entity: Bet): BetResponseDto {
    return {
      id: entity.id,
      fanId: entity.fanId,
      matchId: entity.matchId,
      fanPaymentMethodId: entity.fanPaymentMethodId,
      amount: entity.amount,
      placedAt: entity.placedAt.toISOString(),
    };
  }

  toResponseDtoList(entities: Bet[]): BetResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
