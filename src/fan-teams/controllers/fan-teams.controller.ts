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
import { CreateFanTeamDto } from '../dtos/create-fan-team.dto';
import { UpdateFanTeamDto } from '../dtos/update-fan-team.dto';
import { FanTeamsService } from '../services/fan-teams.service';

@Controller('fan-teams')
export class FanTeamsController {
  constructor(private readonly service: FanTeamsService) {}

  @Post()
  create(@Body() dto: CreateFanTeamDto) {
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
  update(@IdParam(idParamPipe()) id: number, @Body() dto: UpdateFanTeamDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.service.remove(id);
  }
}
