import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { FansService } from '../../fans/services/fans.service';
import { MatchesService } from '../../matches/matches.service';
import { SeatingZonesService } from '../../seating-zones/services/seating-zones.service';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { TicketResponseDto } from '../dtos/ticket-response.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { Ticket } from '../entities/ticket.entity';
import { TicketMapper } from '../mappers/ticket.mapper';
import {
  TICKETS_REPOSITORY,
  type TicketRepository,
} from '../repositories/ticket.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'el boleto',
  duplicate: 'Ya existe el boleto con esos datos',
  references: {
    FK_tickets_fan: 'el aficionado',
    FK_tickets_match: 'el partido',
    FK_tickets_seating_zone: 'la localidad',
  },
};

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKETS_REPOSITORY) private readonly repository: TicketRepository,
    private readonly mapper: TicketMapper,
    private readonly fansService: FansService,
    private readonly matchesService: MatchesService,
    private readonly seatingZonesService: SeatingZonesService,
  ) {}

  async create(dto: CreateTicketDto): Promise<TicketResponseDto> {
    await this.assertCanIssue(dto);
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async findAll(): Promise<TicketResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<TicketResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(id: number, dto: UpdateTicketDto): Promise<TicketResponseDto> {
    const entity = await this.getOrFail(id);
    await this.assertCanIssue(dto, id, entity.fanId !== dto.fanId);
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

  // (Propuesta) Class diagram: Venue (1) - SeatingZone (n) - Ticket (n) and
  // Venue (1) - Match (n). The seating zone must belong to the venue of the match,
  // it cannot exceed its capacity and the fan must be active.
  private async assertCanIssue(
    dto: CreateTicketDto,
    ticketId?: number,
    checkFan = true,
  ): Promise<void> {
    const fan = await this.fansService.findOne(dto.fanId);
    if (checkFan && !fan.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El aficionado ${dto.fanId} está inactivo`,
      );
    }
    const match = await this.matchesService.findOne(dto.matchId);
    const seatingZone = await this.seatingZonesService.findOne(
      dto.seatingZoneId,
    );
    if (match.venueId === null || match.venueId !== seatingZone.venueId) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `La localidad ${dto.seatingZoneId} no pertenece al escenario del partido ${dto.matchId}`,
      );
    }
    if (seatingZone.capacity !== null) {
      const sold = await this.repository.countByMatchAndSeatingZone(
        dto.matchId,
        dto.seatingZoneId,
        ticketId,
      );
      if (sold >= seatingZone.capacity) {
        throw new ApplicationException(
          ErrorCase.INVALID_STATE,
          `La localidad ${dto.seatingZoneId} no tiene cupos disponibles para el partido ${dto.matchId}`,
        );
      }
    }
  }

  private async getOrFail(id: number): Promise<Ticket> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe el boleto con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: Ticket): Promise<Ticket> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
