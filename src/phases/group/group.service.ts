import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';
import { GroupMapper } from './mappers/group.mapper';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    private readonly groupMapper: GroupMapper,
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
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    return this.groupMapper.toResponseDto(group);
  }

  async update(id: number, dto: UpdateGroupDto): Promise<GroupResponseDto> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

    const merged = this.groupMapper.mergeEntity(group, dto);
    const saved = await this.groupsRepository.save(merged);
    return this.groupMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

    await this.groupsRepository.remove(group);
    return { message: `Group #${id} deleted successfully` };
  }
}
