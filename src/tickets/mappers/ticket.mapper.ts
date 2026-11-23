import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { TicketResponseDto } from '../dtos/ticket-response.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { Ticket } from '../entities/ticket.entity';

// Strings arrive already trimmed: the DTO does it (class-transformer).
@Injectable()
export class TicketMapper {
  toEntity(dto: CreateTicketDto): Ticket {
    const entity = new Ticket();
    entity.fanId = dto.fanId;
    entity.matchId = dto.matchId;
    entity.seatingZoneId = dto.seatingZoneId;
    entity.price = dto.price;
    return entity;
  }

  // PUT replaces every editable field.
  replaceEntity(entity: Ticket, dto: UpdateTicketDto): Ticket {
    entity.fanId = dto.fanId;
    entity.matchId = dto.matchId;
    entity.seatingZoneId = dto.seatingZoneId;
    entity.price = dto.price;
    return entity;
  }

  toResponseDto(entity: Ticket): TicketResponseDto {
    return {
      id: entity.id,
      fanId: entity.fanId,
      matchId: entity.matchId,
      seatingZoneId: entity.seatingZoneId,
      price: entity.price,
      purchasedAt: entity.purchasedAt.toISOString(),
    };
  }

  toResponseDtoList(entities: Ticket[]): TicketResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
