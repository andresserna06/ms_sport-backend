import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { IdParam } from '../../common/decorators/id-param.decorator';
import { idParamPipe } from '../../common/pipes/id-param.pipe';
import { ListTeamSportsQueryDto } from '../dtos/list-team-sports-query.dto';
import { TeamSportsService } from '../services/team-sports.service';

// One controller with full routes: the association belongs to both resources
// and this avoids a circular dependency between the teams and sports modules.
@Controller()
export class TeamSportsController {
  constructor(private readonly teamSportsService: TeamSportsService) {}

  @Post('teams/:teamId/sports/:sportId')
  associate(
    @IdParam('teamId', idParamPipe()) teamId: number,
    @IdParam('sportId', idParamPipe()) sportId: number,
  ) {
    return this.teamSportsService.associate(teamId, sportId);
  }

  @Delete('teams/:teamId/sports/:sportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  dissociate(
    @IdParam('teamId', idParamPipe()) teamId: number,
    @IdParam('sportId', idParamPipe()) sportId: number,
  ) {
    return this.teamSportsService.dissociate(teamId, sportId);
  }

  @Get('teams/:id/sports')
  findSportsOfTeam(
    @IdParam(idParamPipe()) id: number,
    @Query() query: ListTeamSportsQueryDto,
  ) {
    return this.teamSportsService.findSportsOfTeam(id, query.active);
  }

  @Get('sports/:id/teams')
  findTeamsOfSport(
    @IdParam(idParamPipe()) id: number,
    @Query() query: ListTeamSportsQueryDto,
  ) {
    return this.teamSportsService.findTeamsOfSport(id, query.active);
  }
}
