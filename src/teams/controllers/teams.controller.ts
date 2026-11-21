import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IdParam } from '../../common/decorators/id-param.decorator';
import { idParamPipe } from '../../common/pipes/id-param.pipe';
import { CreateTeamDto } from '../dtos/create-team.dto';
import { ListTeamsQueryDto } from '../dtos/list-teams-query.dto';
import { UpdateTeamDto } from '../dtos/update-team.dto';
import { TeamsService } from '../services/teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListTeamsQueryDto) {
    return this.teamsService.findAll(query.active);
  }

  @Get('reports/active-by-city')
  activeByCityReport() {
    return this.teamsService.getActiveByCityReport();
  }

  @Get(':id')
  findOne(@IdParam(idParamPipe()) id: number) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  update(@IdParam(idParamPipe()) id: number, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@IdParam(idParamPipe()) id: number) {
    return this.teamsService.deactivate(id);
  }

  @Patch(':id/activate')
  activate(@IdParam(idParamPipe()) id: number) {
    return this.teamsService.activate(id);
  }

  @Delete(':id')
  remove(@IdParam(idParamPipe()) id: number) {
    return this.teamsService.remove(id);
  }
}
