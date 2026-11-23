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
import { CreateSeatingZoneDto } from '../dtos/create-seating-zone.dto';
import { UpdateSeatingZoneDto } from '../dtos/update-seating-zone.dto';
import { SeatingZonesService } from '../services/seating-zones.service';

@Controller('seating-zones')
export class SeatingZonesController {
  constructor(private readonly service: SeatingZonesService) {}

  @Post()
  create(@Body() dto: CreateSeatingZoneDto) {
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
    @Body() dto: UpdateSeatingZoneDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.service.remove(id);
  }
}
