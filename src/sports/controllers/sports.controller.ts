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
import { CreateSportDto } from '../dtos/create-sport.dto';
import { ListSportsQueryDto } from '../dtos/list-sports-query.dto';
import { ListSubSportsQueryDto } from '../dtos/list-sub-sports-query.dto';
import { UpdateSportDto } from '../dtos/update-sport.dto';
import { SportsService } from '../services/sports.service';

@Controller('sports')
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Post()
  create(@Body() dto: CreateSportDto) {
    return this.sportsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListSportsQueryDto) {
    return this.sportsService.findAll(query);
  }

  @Get(':id')
  findOne(@IdParam(idParamPipe()) id: number) {
    return this.sportsService.findOne(id);
  }

  @Get(':id/subsports')
  findSubSports(
    @IdParam(idParamPipe()) id: number,
    @Query() query: ListSubSportsQueryDto,
  ) {
    return this.sportsService.findSubSports(id, query);
  }

  @Put(':id')
  update(@IdParam(idParamPipe()) id: number, @Body() dto: UpdateSportDto) {
    return this.sportsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@IdParam(idParamPipe()) id: number) {
    return this.sportsService.deactivate(id);
  }

  @Patch(':id/activate')
  activate(@IdParam(idParamPipe()) id: number) {
    return this.sportsService.activate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.sportsService.remove(id);
  }
}
