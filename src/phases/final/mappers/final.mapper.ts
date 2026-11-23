import { Injectable } from '@nestjs/common';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { FinalRound } from '../../base/entities/phase.entity';
import { CreateFinalDto } from '../dto/create-final.dto';
import { FinalResponseDto } from '../dto/final-response.dto';
import { UpdateFinalDto } from '../dto/update-final.dto';
import { Final } from '../entities/final.entity';

const FINAL_ROUND_NAMES: Record<FinalRound, string> = {
  [FinalRound.ROUND_OF_16]: 'Octavos de final',
  [FinalRound.QUARTERFINAL]: 'Cuartos de final',
  [FinalRound.SEMIFINAL]: 'Semifinal',
  [FinalRound.THIRD_PLACE]: 'Tercer puesto',
  [FinalRound.FINAL]: 'Final',
};

@Injectable()
export class FinalMapper {
  toEntity(dto: CreateFinalDto, tournamentId: number): Final {
    const entity = new Final();
    entity.finalRound = dto.finalRound;
    entity.name = FINAL_ROUND_NAMES[dto.finalRound];
    entity.order = dto.order;
    entity.tournament = { id: tournamentId } as Tournament;
    return entity;
  }

  mergeEntity(entity: Final, dto: UpdateFinalDto): Final {
    if (dto.order !== undefined) entity.order = dto.order;
    if (dto.finalRound !== undefined) {
      entity.finalRound = dto.finalRound;
      entity.name = FINAL_ROUND_NAMES[dto.finalRound];
    }
    return entity;
  }

  toResponseDto(entity: Final): FinalResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      order: entity.order,
      tournamentId: entity.tournament?.id ?? null,
      phaseType: 'FINAL',
      finalRound: entity.finalRound ?? null,
    };
  }

  toResponseDtoList(entities: Final[]): FinalResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
