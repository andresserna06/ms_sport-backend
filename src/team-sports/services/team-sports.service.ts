import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { SportsService } from '../../sports/services/sports.service';
import { TeamsService } from '../../teams/services/teams.service';
import { TeamSportResponseDto } from '../dtos/team-sport-response.dto';
import { TeamSportSummaryDto } from '../dtos/team-sport-summary.dto';
import { TeamSportMapper } from '../mappers/team-sport.mapper';
import {
  DuplicateTeamSportError,
  TEAM_SPORT_REPOSITORY,
  TeamSportTargetMissingError,
  type TeamSportRepository,
} from '../repositories/team-sport.repository';

interface Named {
  id: number;
  name: string;
  active: boolean;
}

@Injectable()
export class TeamSportsService {
  constructor(
    @Inject(TEAM_SPORT_REPOSITORY)
    private readonly repository: TeamSportRepository,
    private readonly mapper: TeamSportMapper,
    private readonly teamsService: TeamsService,
    private readonly sportsService: SportsService,
  ) {}

  async associate(
    teamId: number,
    sportId: number,
  ): Promise<TeamSportResponseDto> {
    const { team, sport } = await this.getTeamAndSport(teamId, sportId);

    if (!team.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El equipo "${team.name}" está inactivo y no puede asociarse a un deporte`,
      );
    }
    if (!sport.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `El deporte "${sport.name}" está inactivo y no admite nuevos equipos`,
      );
    }

    if (await this.repository.findPair(teamId, sportId)) {
      throw this.alreadyAssociated(team, sport);
    }

    try {
      const saved = await this.repository.create(teamId, sportId);
      return this.mapper.toResponseDto(saved, team, sport);
    } catch (error) {
      // The check above is not atomic; the UNIQUE index decides when two
      // requests race, and a deleted team or sport surfaces as a missing row.
      if (error instanceof DuplicateTeamSportError) {
        throw this.alreadyAssociated(team, sport);
      }
      if (error instanceof TeamSportTargetMissingError) {
        throw new ApplicationException(
          ErrorCase.NOT_FOUND,
          'El equipo o el deporte ya no existe',
        );
      }
      throw error;
    }
  }

  // Removing is allowed even when the team or the sport is inactive: it is
  // the way to release their deletion.
  async dissociate(teamId: number, sportId: number): Promise<void> {
    const { team, sport } = await this.getTeamAndSport(teamId, sportId);

    const association = await this.repository.findPair(teamId, sportId);
    if (!association) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `El equipo "${team.name}" no está asociado al deporte "${sport.name}"`,
      );
    }
    await this.repository.remove(association);
  }

  async findSportsOfTeam(
    teamId: number,
    active?: boolean,
  ): Promise<TeamSportSummaryDto[]> {
    await this.teamsService.findOne(teamId);
    const associations = await this.repository.findByTeam(teamId, active);
    return this.mapper.toSportSummaries(associations);
  }

  async findTeamsOfSport(
    sportId: number,
    active?: boolean,
  ): Promise<TeamSportSummaryDto[]> {
    await this.sportsService.findOne(sportId);
    const associations = await this.repository.findBySport(sportId, active);
    return this.mapper.toTeamSummaries(associations);
  }

  // The team is validated first, so that is the 404 reported when both are
  // missing.
  private async getTeamAndSport(
    teamId: number,
    sportId: number,
  ): Promise<{ team: Named; sport: Named }> {
    const team = await this.teamsService.findOne(teamId);
    const sport = await this.sportsService.findOne(sportId);
    return { team, sport };
  }

  private alreadyAssociated(team: Named, sport: Named): ApplicationException {
    return new ApplicationException(
      ErrorCase.ALREADY_EXISTS,
      `El equipo "${team.name}" ya está asociado al deporte "${sport.name}"`,
    );
  }
}
