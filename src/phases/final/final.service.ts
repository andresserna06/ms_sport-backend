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
}

