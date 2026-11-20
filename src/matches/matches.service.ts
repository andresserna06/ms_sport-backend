import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase } from '../phases/base/entities/phase.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match, MatchStatus } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { MatchesRepository } from './repositories/matches.repository';
import { ApplicationException } from '../exception/application.exception';
import { ErrorCase } from '../exception/error-case.enum';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    private readonly customMatchesRepository: MatchesRepository,
    private readonly matchMapper: MatchMapper,
  ) {}

  async create(dto: CreateMatchDto): Promise<MatchResponseDto> {
    const phase = await this.findPhase(dto.phaseId);
    const saved = await this.matchesRepository.save(
      this.matchMapper.toEntity(dto, phase),
    );
    return this.findOne(saved.id);
  }

  async findAll(): Promise<MatchResponseDto[]> {
    const matches = await this.matchesRepository.find({
      relations: { phase: true },
      order: { scheduledAt: 'ASC' },
    });
    return this.matchMapper.toResponseDtoList(matches);
  }

  async findOne(id: number): Promise<MatchResponseDto> {
    return this.matchMapper.toResponseDto(await this.findMatch(id));
  }

  async findByPhase(phaseId: number): Promise<MatchResponseDto[]> {
    await this.findPhase(phaseId);
    const matches = await this.matchesRepository.find({
      where: { phase: { id: phaseId } },
      order: { scheduledAt: 'ASC' },
    });
    return this.matchMapper.toResponseDtoList(matches, phaseId);
  }

  async update(id: number, dto: UpdateMatchDto): Promise<MatchResponseDto> {
    const match = await this.findMatch(id);

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `Match #${id} is ${match.status} and can no longer be updated`,
      );
    }

    if (dto.phaseId !== undefined) {
      match.phase = await this.findPhase(dto.phaseId);
    }

    const merged = this.matchMapper.mergeEntity(match, dto);
    this.validateResult(merged);

    const saved = await this.matchesRepository.save(merged);
    return this.matchMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const match = await this.findMatch(id);

    await this.matchesRepository.remove(match);
    return { message: `Match #${id} deleted successfully` };
  }

  async getStatusReport(status: MatchStatus): Promise<MatchResponseDto[]> {
    return this.customMatchesRepository.findByStatusReport(status);
  }

  private async findMatch(id: number): Promise<Match> {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: { phase: true },
    });
    if (!match) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `Match with id ${id} not found`,
      );
    }
    return match;
  }

  private async findPhase(id: number): Promise<Phase> {
    const phase = await this.phasesRepository.findOneBy({ id });
    if (!phase) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `Phase with id ${id} not found`,
      );
    }
    return phase;
  }

  private validateResult(match: Match): void {
    const hasScores = match.homeScore !== null || match.awayScore !== null;

    if (match.status === MatchStatus.FINISHED) {
      if (match.homeScore === null || match.awayScore === null) {
        throw new ApplicationException(
          ErrorCase.INVALID_OPERATION,
          'A finished match needs both scores',
        );
      }
    } else if (hasScores) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        'Scores can only be set when the match is FINISHED',
      );
    }
  }
}
