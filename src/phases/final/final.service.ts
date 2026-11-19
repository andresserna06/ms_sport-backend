import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFinalDto } from './dto/create-final.dto';
import { FinalResponseDto } from './dto/final-response.dto';
import { UpdateFinalDto } from './dto/update-final.dto';
import { Final } from './entities/final.entity';
import { FinalMapper } from './mappers/final.mapper';

@Injectable()
export class FinalService {
  constructor(
    @InjectRepository(Final)
    private readonly finalsRepository: Repository<Final>,
    private readonly finalMapper: FinalMapper,
  ) {}

  async create(dto: CreateFinalDto): Promise<FinalResponseDto> {
    const entity = this.finalMapper.toEntity(dto);
    const saved = await this.finalsRepository.save(entity);
    return this.finalMapper.toResponseDto(saved);
  }

  async findAll(): Promise<FinalResponseDto[]> {
    const finals = await this.finalsRepository.find({ order: { order: 'ASC' } });
    return this.finalMapper.toResponseDtoList(finals);
  }

  async findOne(id: number): Promise<FinalResponseDto> {
    const final = await this.finalsRepository.findOne({ where: { id } });
    if (!final) {
      throw new NotFoundException(`Final with id ${id} not found`);
    }
    return this.finalMapper.toResponseDto(final);
  }

  async update(id: number, dto: UpdateFinalDto): Promise<FinalResponseDto> {
    const final = await this.finalsRepository.findOne({ where: { id } });
    if (!final) {
      throw new NotFoundException(`Final with id ${id} not found`);
    }

    const merged = this.finalMapper.mergeEntity(final, dto);
    const saved = await this.finalsRepository.save(merged);
    return this.finalMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const final = await this.finalsRepository.findOne({ where: { id } });
    if (!final) {
      throw new NotFoundException(`Final with id ${id} not found`);
    }

    await this.finalsRepository.remove(final);
    return { message: `Final #${id} deleted successfully` };
  }
}
