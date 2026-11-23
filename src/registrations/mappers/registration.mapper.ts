import { Injectable } from '@nestjs/common';
import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { RegistrationResponseDto } from '../dto/registration-response.dto';
import { Registration, RegistrationStatus } from '../entities/registration.entity';

@Injectable()
export class RegistrationMapper {
  toEntity(team: Team, tournament: Tournament): Registration {
    const entity = new Registration();
    entity.team = team;
    entity.tournament = tournament;
    entity.status = RegistrationStatus.CONFIRMED;
    entity.withdrawnAt = null;
    return entity;
  }

  toResponseDto(entity: Registration): RegistrationResponseDto {
    return {
      id: entity.id,
      registeredAt: entity.registeredAt,
      withdrawnAt: entity.withdrawnAt ?? null,
      status: entity.status,
      team: { id: entity.team.id, name: entity.team.name },
      tournament: { id: entity.tournament.id, name: entity.tournament.name },
    };
  }

  toResponseDtoList(entities: Registration[]): RegistrationResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
