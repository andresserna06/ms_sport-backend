import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { IdParam } from '../../common/decorators/id-param.decorator';
import { idParamPipe } from '../../common/pipes/id-param.pipe';
import { PhasesService } from '../../phases/base/phases.service';
import { CreateTournamentDto } from '../dtos/create-tournament.dto';
import { ListTournamentsQueryDto } from '../dtos/list-tournaments-query.dto';
import { UpdateTournamentDto } from '../dtos/update-tournament.dto';
import { TournamentsService } from '../services/tournaments.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly phasesService: PhasesService,
  ) {}

  @Post()
  create(@Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListTournamentsQueryDto) {
    return this.tournamentsService.findAll(query);
  }

  @Get('reports/open-enrollment')
  openEnrollmentReport() {
    return this.tournamentsService.getOpenEnrollmentReport();
  }

  @Get(':id/overview')
  overview(@IdParam(idParamPipe()) id: number) {
    return this.tournamentsService.getOverview(id);
  }

  @Get(':id/phases')
  async findPhases(@IdParam(idParamPipe()) id: number) {
    await this.tournamentsService.findOne(id);
    return this.phasesService.findAll(id);
  }

  @Get(':id')
  findOne(@IdParam(idParamPipe()) id: number) {
    return this.tournamentsService.findOne(id);
  }

  @Put(':id')
  update(@IdParam(idParamPipe()) id: number, @Body() dto: UpdateTournamentDto) {
    return this.tournamentsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@IdParam(idParamPipe()) id: number) {
    return this.tournamentsService.deactivate(id);
  }

  @Patch(':id/activate')
  activate(@IdParam(idParamPipe()) id: number) {
    return this.tournamentsService.activate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.tournamentsService.remove(id);
  }
}
