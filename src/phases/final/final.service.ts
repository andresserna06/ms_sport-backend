import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TournamentsService } from '../../tournaments/services/tournaments.service';
import { CreateFinalDto } from './dto/create-final.dto';
import { FinalResponseDto } from './dto/final-response.dto';
import { UpdateFinalDto } from './dto/update-final.dto';
import { Final } from './entities/final.entity';
import { FinalMapper } from './mappers/final.mapper';
import { PhasesService } from '../base/phases.service';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';

@Injectable()
export class FinalService {
  constructor(
    @InjectRepository(Final)
    private readonly finalsRepository: Repository<Final>,
    private readonly finalMapper: FinalMapper,
    private readonly phasesService: PhasesService,
    private readonly tournamentsService: TournamentsService,
  ) {}

  async create(dto: CreateFinalDto): Promise<FinalResponseDto> {
    await this.getTournamentOrFail(dto.tournamentId);
    if (dto.order < 1) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, 'El orden de la fase final debe ser mayor o igual a 1');
    }

    if (
      await this.phasesService.existsByNameInTournament(
        dto.name,
        dto.tournamentId,
      )
    ) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una fase con el nombre "${dto.name}" en el torneo ${dto.tournamentId}`,
      );
    }

    await this.assertFinalOrderGreaterThanGroups(dto.tournamentId, dto.order);
    await this.assertFinalRoundNotRepeated(dto.tournamentId, dto.finalRound);

    const entity = this.finalMapper.toEntity(dto, dto.tournamentId);
    const saved = await this.finalsRepository.save(entity);
    return this.finalMapper.toResponseDto(saved);
  }

  async findAll(tournamentId?: number): Promise<FinalResponseDto[]> {
    const finals = await this.finalsRepository.find({
      where:
        tournamentId === undefined ? {} : { tournament: { id: tournamentId } },
      relations: { tournament: true },
      order: { order: 'ASC' },
    });
    return this.finalMapper.toResponseDtoList(finals);
  }

  async findOne(id: number): Promise<FinalResponseDto> {
    const final = await this.getFinalOrFail(id);
    return this.finalMapper.toResponseDto(final);
  }

  async update(id: number, dto: UpdateFinalDto): Promise<FinalResponseDto> {
    const final = await this.getFinalOrFail(id);
    const tournamentId = final.tournament?.id;
    if (dto.order !== undefined && dto.order < 1) {
      throw new ApplicationException(ErrorCase.INVALID_STATE, 'El orden de la fase final debe ser mayor o igual a 1');
    }

    if (
      dto.name !== undefined &&
      tournamentId !== undefined &&
      (await this.phasesService.existsByNameInTournament(
        dto.name,
        tournamentId,
        id,
      ))
    ) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una fase con el nombre "${dto.name}" en el torneo ${tournamentId}`,
      );
    }

    if (tournamentId !== undefined) {
      const nextOrder = dto.order ?? final.order;
      const nextRound = dto.finalRound ?? final.finalRound;
      await this.assertFinalOrderGreaterThanGroups(tournamentId, nextOrder);
      if (nextRound) await this.assertFinalRoundNotRepeated(tournamentId, nextRound, id);
    }

    const merged = this.finalMapper.mergeEntity(final, dto);
    const saved = await this.finalsRepository.save(merged);
    return this.finalMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const final = await this.getFinalOrFail(id);

    if (await this.phasesService.hasMatches(id)) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `La fase final #${id} tiene partidos y no se puede eliminar`,
      );
    }

    await this.finalsRepository.remove(final);
  }

  private async getFinalOrFail(id: number): Promise<Final> {
    const final = await this.finalsRepository.findOne({
      where: { id },
      relations: { tournament: true },
    });
    if (!final) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe una fase final con el id ${id}`,
      );
    }
    return final;
  }

  private async getTournamentOrFail(id: number): Promise<void> {
    await this.tournamentsService.findOne(id);
  }

  private async assertFinalOrderGreaterThanGroups(tournamentId: number, order: number): Promise<void> {
    const maxGroupOrder = await this.phasesService.findMaxGroupOrder(tournamentId);
    if (maxGroupOrder !== null && order <= maxGroupOrder) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El orden de la fase final debe ser mayor al orden m?ximo de los grupos (${maxGroupOrder})`,
      );
    }
  }

  private async assertFinalRoundNotRepeated(
    tournamentId: number,
    finalRound: string,
    excludeId?: number,
  ): Promise<void> {
    const qb = this.finalsRepository
      .createQueryBuilder('final')
      .where('final.tournament_id = :tournamentId', { tournamentId })
      .andWhere('final.final_round = :finalRound', { finalRound });
    if (excludeId !== undefined) qb.andWhere('final.id <> :excludeId', { excludeId });
    const exists = await qb.getCount();
    if (exists > 0) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una fase final con la ronda ${finalRound} en el torneo ${tournamentId}`,
      );
    }
  }
}

