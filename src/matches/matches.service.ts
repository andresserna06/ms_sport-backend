import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { Match, MatchStatus } from './entities/match.entity';
import { MatchMapper } from './mappers/match.mapper';
import { MatchesRepository } from './repositories/matches.repository';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    private readonly customMatchesRepository: MatchesRepository,
    private readonly matchMapper: MatchMapper,
  ) {}

  async create(dto: CreateMatchDto): Promise<MatchResponseDto> {
    const entity = this.matchMapper.toEntity(dto);
    const saved = await this.matchesRepository.save(entity);
    return this.matchMapper.toResponseDto(saved);
  }

  async findAll(): Promise<MatchResponseDto[]> {
    const matches = await this.matchesRepository.find({ order: { scheduledAt: 'ASC' } });
    return this.matchMapper.toResponseDtoList(matches);
  }

  async findOne(id: number): Promise<MatchResponseDto> {
    const match = await this.matchesRepository.findOne({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with id ${id} not found`);
    }
    return this.matchMapper.toResponseDto(match);
  }

  async update(id: number, dto: UpdateMatchDto): Promise<MatchResponseDto> {
    const match = await this.matchesRepository.findOne({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with id ${id} not found`);
    }

    if (match.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException(
        `Match #${id} is ${match.status} and can no longer be updated`,
      );
    }

    const merged = this.matchMapper.mergeEntity(match, dto);
    this.validateResult(merged);

    const saved = await this.matchesRepository.save(merged);
    return this.matchMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const match = await this.matchesRepository.findOne({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with id ${id} not found`);
    }

    await this.matchesRepository.remove(match);
    return { message: `Match #${id} deleted successfully` };
  }

  async getStatusReport(status: MatchStatus): Promise<MatchResponseDto[]> {
    const rows = await this.customMatchesRepository.findByStatusReport(status);
    return this.matchMapper.toResponseDtoList(rows);
  }

  private validateResult(match: Match): void {
    const hasScores = match.homeScore !== null || match.awayScore !== null;

    if (match.status === MatchStatus.FINISHED) {
      if (match.homeScore === null || match.awayScore === null) {
        throw new BadRequestException('A finished match needs both scores');
      }
    } else if (hasScores) {
      throw new BadRequestException('Scores can only be set when the match is FINISHED');
    }
  }
}
