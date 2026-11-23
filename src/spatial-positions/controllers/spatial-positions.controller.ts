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
import { CreateSpatialPositionDto } from '../dtos/create-spatial-position.dto';
import { UpdateSpatialPositionDto } from '../dtos/update-spatial-position.dto';
import { SpatialPositionsService } from '../services/spatial-positions.service';

@Controller('spatial-positions')
export class SpatialPositionsController {
  constructor(private readonly service: SpatialPositionsService) {}

  @Post()
  create(@Body() dto: CreateSpatialPositionDto) {
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
    @Body() dto: UpdateSpatialPositionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.service.remove(id);
  }
}
