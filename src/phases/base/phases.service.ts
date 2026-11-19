import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhaseResponseDto } from './dto/phase-response.dto';
import { Phase } from './entities/phase.entity';
import { PhaseMapper } from './mappers/phase.mapper';
import { PhasesRepository } from './repositories/phases.repository';

@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    private readonly customPhasesRepository: PhasesRepository,
    private readonly phaseMapper: PhaseMapper,
  ) {}

  async findAll(): Promise<PhaseResponseDto[]> {
    const phases = await this.phasesRepository.find({ order: { order: 'ASC' } });
    return this.phaseMapper.toResponseDtoList(phases);
  }

  async findOne(id: number): Promise<PhaseResponseDto> {
    const phase = await this.phasesRepository.findOne({ where: { id } });
    if (!phase) {
      throw new NotFoundException(`Phase with id ${id} not found`);
    }
    return this.phaseMapper.toResponseDto(phase);
  }

  async getCountByTypeReport(): Promise<{ phaseType: string; total: number }[]> {
    return this.customPhasesRepository.findCountByTypeReport();
  }
}
