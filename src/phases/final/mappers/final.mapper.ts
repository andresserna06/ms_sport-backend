import { Injectable } from '@nestjs/common';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { CreateFinalDto } from '../dto/create-final.dto';
import { FinalResponseDto } from '../dto/final-response.dto';
import { UpdateFinalDto } from '../dto/update-final.dto';
import { Final } from '../entities/final.entity';

@Injectable()
export class FinalMapper {
  toEntity(dto: CreateFinalDto, tournamentId: number): Final {
    const entity = new Final();
    entity.name = dto.name;
    entity.order = dto.order;
    entity.tournament = { id: tournamentId } as Tournament;
    return entity;
  }

  mergeEntity(entity: Final, dto: UpdateFinalDto): Final {
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.order !== undefined) entity.order = dto.order;
    return entity;
  }

  toResponseDto(entity: Final): FinalResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      order: entity.order,
      tournamentId: entity.tournament?.id ?? null,
      phaseType: 'FINAL',
    };
  }

  toResponseDtoList(entities: Final[]): FinalResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
