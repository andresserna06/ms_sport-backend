import { Injectable } from '@nestjs/common';
import { MatchMapper } from '../../../matches/mappers/match.mapper';
import { PhaseResponseDto } from '../dto/phase-response.dto';
import { Phase } from '../entities/phase.entity';

@Injectable()
export class PhaseMapper {
  constructor(private readonly matchMapper: MatchMapper) {}

  toResponseDto(entity: Phase): PhaseResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      order: entity.order,
      tournamentId: entity.tournament?.id ?? null,
      phaseType: entity.phaseType as 'GROUP' | 'FINAL',
      finalRound: entity.finalRound ?? null,
      matches: entity.matches
        ? this.matchMapper.toResponseDtoList(entity.matches, entity.id)
        : undefined,
    };
  }

  toResponseDtoList(entities: Phase[]): PhaseResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
