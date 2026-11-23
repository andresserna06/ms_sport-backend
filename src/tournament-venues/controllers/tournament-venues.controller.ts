import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { IdParam } from '../../common/decorators/id-param.decorator';
import { idParamPipe } from '../../common/pipes/id-param.pipe';
import { CreateTournamentVenueDto } from '../dtos/create-tournament-venue.dto';
import { UpdateTournamentVenueDto } from '../dtos/update-tournament-venue.dto';
import { TournamentVenuesService } from '../services/tournament-venues.service';

@Controller('tournament-venues')
export class TournamentVenuesController {
  constructor(private readonly service: TournamentVenuesService) {}

  @Post()
  create(@Body() dto: CreateTournamentVenueDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@IdParam(idParamPipe()) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @IdParam(idParamPipe()) id: number,
    @Body() dto: UpdateTournamentVenueDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.service.remove(id);
  }
}
