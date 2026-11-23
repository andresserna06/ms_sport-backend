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

    await this.assertFinalOrderGreaterThanGroups(dto.tournamentId, dto.order);
    await this.assertFinalRoundNotRepeated(dto.tournamentId, dto.finalRound);
    await this.assertFinalRoundOrderCoherence(dto.tournamentId, dto.finalRound, dto.order);

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

    if (tournamentId !== undefined) {
      const nextOrder = dto.order ?? final.order;
      const nextRound = dto.finalRound ?? final.finalRound;
      await this.assertFinalOrderGreaterThanGroups(tournamentId, nextOrder);
      if (nextRound) {
        await this.assertFinalRoundNotRepeated(tournamentId, nextRound, id);
        await this.assertFinalRoundOrderCoherence(tournamentId, nextRound, nextOrder, id);
      }
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

  private async assertFinalRoundOrderCoherence(
    tournamentId: number,
    finalRound: string,
    order: number,
    excludeId?: number,
  ): Promise<void> {
    const sequence = ['ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL', 'FINAL'];
    const rank = (round: string): number => {
      if (round === 'THIRD_PLACE') return sequence.indexOf('FINAL');
      return sequence.indexOf(round);
    };
    const currentRank = rank(finalRound);
    if (currentRank < 0) return;
    const qb = this.finalsRepository
      .createQueryBuilder('final')
      .where('final.tournament_id = :tournamentId', { tournamentId });
    if (excludeId !== undefined) qb.andWhere('final.id <> :excludeId', { excludeId });
    const finals = await qb.getMany();
    for (const other of finals) {
      if (!other.finalRound) continue;
      const otherRank = rank(other.finalRound);
      if (otherRank < 0) continue;
      if (currentRank < otherRank && order >= other.order) {
        throw new ApplicationException(ErrorCase.INVALID_STATE, `La ronda ${finalRound} debe tener un orden menor que ${other.finalRound}`);
      }
      if (currentRank > otherRank && order <= other.order) {
        throw new ApplicationException(ErrorCase.INVALID_STATE, `La ronda ${finalRound} debe tener un orden mayor que ${other.finalRound}`);
      }
      if (currentRank === otherRank && order !== other.order) {
        throw new ApplicationException(ErrorCase.INVALID_STATE, `La ronda ${finalRound} debe tener el mismo orden que ${other.finalRound}`);
      }
    }
  }
}

