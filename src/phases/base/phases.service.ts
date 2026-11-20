import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesRepository } from './repositories/phases.repository';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    private readonly customPhasesRepository: PhasesRepository,
    private readonly phaseMapper: PhaseMapper,
  ) {}

  async findAll(): Promise<PhaseResponseDto[]> {
    const phases = await this.phasesRepository.find({
      relations: { matches: true },
      order: { order: 'ASC' },
    });
    return this.phaseMapper.toResponseDtoList(phases);
  }

  async findOne(id: number): Promise<PhaseResponseDto> {
    const phase = await this.phasesRepository.findOne({
      where: { id },
      relations: { matches: true },
    });
    if (!phase) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `Phase with id ${id} not found`,
      );
    }
    return this.phaseMapper.toResponseDto(phase);
  }

  async hasMatches(id: number): Promise<boolean> {
    const total = await this.matchesRepository.count({
      where: { phase: { id } },
    });
    return total > 0;
  }

  async getCountByTypeReport(): Promise<{ phaseType: string; total: number }[]> {
    return this.customPhasesRepository.findCountByTypeReport();
  }
}
