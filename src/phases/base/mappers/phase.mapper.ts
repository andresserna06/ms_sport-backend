import { Injectable } from '@nestjs/common';
import { PhaseResponseDto } from '../dto/phase-response.dto';
import { Phase } from '../entities/phase.entity';

@Injectable()
export class PhaseMapper {
  toResponseDto(entity: Phase): PhaseResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      order: entity.order,
      phaseType: entity.phaseType as 'GROUP' | 'FINAL',
    };
  }

  toResponseDtoList(entities: Phase[]): PhaseResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
