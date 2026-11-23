import { Inject, Injectable } from '@nestjs/common';
import {
  toApplicationException,
  type PersistenceMessages,
} from '../../common/persistence/database-errors';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreateTournamentVenueDto } from '../dtos/create-tournament-venue.dto';
import { TournamentVenueResponseDto } from '../dtos/tournament-venue-response.dto';
import { UpdateTournamentVenueDto } from '../dtos/update-tournament-venue.dto';
import { TournamentVenue } from '../entities/tournament-venue.entity';
import { TournamentVenueMapper } from '../mappers/tournament-venue.mapper';
import {
  TOURNAMENT_VENUES_REPOSITORY,
  type TournamentVenueRepository,
} from '../repositories/tournament-venue.repository';

const MESSAGES: PersistenceMessages = {
  singular: 'la asignación del escenario al torneo',
  duplicate: 'El escenario ya está asignado a ese torneo',
  references: {
    FK_tournament_venues_tournament: 'el torneo',
    FK_tournament_venues_venue: 'el escenario',
  },
};

@Injectable()
export class TournamentVenuesService {
  constructor(
    @Inject(TOURNAMENT_VENUES_REPOSITORY)
    private readonly repository: TournamentVenueRepository,
    private readonly mapper: TournamentVenueMapper,
  ) {}

  async create(
    dto: CreateTournamentVenueDto,
  ): Promise<TournamentVenueResponseDto> {
    const saved = await this.save(this.mapper.toEntity(dto));
    return this.mapper.toResponseDto(saved);
  }

  async isVenueAssignedToTournament(
    tournamentId: number,
    venueId: number,
  ): Promise<boolean> {
    return this.repository.existsByTournamentAndVenue(tournamentId, venueId);
  }

  async findAll(): Promise<TournamentVenueResponseDto[]> {
    return this.mapper.toResponseDtoList(await this.repository.findAll());
  }

  async findOne(id: number): Promise<TournamentVenueResponseDto> {
    return this.mapper.toResponseDto(await this.getOrFail(id));
  }

  async update(
    id: number,
    dto: UpdateTournamentVenueDto,
  ): Promise<TournamentVenueResponseDto> {
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

  private async getOrFail(id: number): Promise<TournamentVenue> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe la asignación del escenario al torneo con id ${id}`,
      );
    }
    return entity;
  }

  private async save(entity: TournamentVenue): Promise<TournamentVenue> {
    try {
      return await this.repository.save(entity);
    } catch (error) {
      throw toApplicationException(error, MESSAGES);
    }
  }
}
