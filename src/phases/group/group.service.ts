import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';
import { GroupMapper } from './mappers/group.mapper';
import { PhasesService } from '../base/phases.service';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    private readonly groupMapper: GroupMapper,
    private readonly phasesService: PhasesService,
  ) {}

  async create(dto: CreateGroupDto): Promise<GroupResponseDto> {
    const entity = this.groupMapper.toEntity(dto);
    const saved = await this.groupsRepository.save(entity);
    return this.groupMapper.toResponseDto(saved);
  }

  async findAll(): Promise<GroupResponseDto[]> {
    const groups = await this.groupsRepository.find({ order: { order: 'ASC' } });
    return this.groupMapper.toResponseDtoList(groups);
  }

  async findOne(id: number): Promise<GroupResponseDto> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `Group with id ${id} not found`,
      );
    }
    return this.groupMapper.toResponseDto(group);
  }

  async update(id: number, dto: UpdateGroupDto): Promise<GroupResponseDto> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `Group with id ${id} not found`,
      );
    }

    const merged = this.groupMapper.mergeEntity(group, dto);
    const saved = await this.groupsRepository.save(merged);
    return this.groupMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `Group with id ${id} not found`,
      );
    }

    if (await this.phasesService.hasMatches(id)) {
      throw new ApplicationException(
        ErrorCase.INVALID_OPERATION,
        `Group #${id} has matches and cannot be deleted`,
      );
    }

    await this.groupsRepository.remove(group);
    return { message: `Group #${id} deleted successfully` };
  }
}
