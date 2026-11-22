import { Injectable } from '@nestjs/common';
import { TeamSportResponseDto } from '../dtos/team-sport-response.dto';
import { TeamSportSummaryDto } from '../dtos/team-sport-summary.dto';
import { TeamSport } from '../entities/team-sport.entity';

@Injectable()
export class TeamSportMapper {
  toResponseDto(
    association: TeamSport,
    team: { id: number; name: string },
    sport: { id: number; name: string },
  ): TeamSportResponseDto {
    return {
      id: association.id,
      team: { id: team.id, name: team.name },
      sport: { id: sport.id, name: sport.name },
    };
  }

  // Sports of a team: the association must be loaded with its sport.
  toSportSummaries(associations: TeamSport[]): TeamSportSummaryDto[] {
    return associations.map(({ sport }) => ({
      id: sport.id,
      name: sport.name,
      active: sport.active,
    }));
  }

  // Teams of a sport: the association must be loaded with its team.
  toTeamSummaries(associations: TeamSport[]): TeamSportSummaryDto[] {
    return associations.map(({ team }) => ({
      id: team.id,
      name: team.name,
      active: team.active,
    }));
  }
}
