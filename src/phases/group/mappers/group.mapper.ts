import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from '../dto/create-group.dto';
import { GroupResponseDto } from '../dto/group-response.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { Group } from '../entities/group.entity';

@Injectable()
export class GroupMapper {
  toEntity(dto: CreateGroupDto): Group {
    const entity = new Group();
    entity.name = dto.name;
    entity.order = dto.order;
    return entity;
  }

  mergeEntity(entity: Group, dto: UpdateGroupDto): Group {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.order !== undefined) entity.order = dto.order;
    return entity;
  }

  toResponseDto(entity: Group): GroupResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      order: entity.order,
      phaseType: 'GROUP',
    };
  }

  toResponseDtoList(entities: Group[]): GroupResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
