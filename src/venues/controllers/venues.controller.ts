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
import { CreateVenueDto } from '../dtos/create-venue.dto';
import { UpdateVenueDto } from '../dtos/update-venue.dto';
import { VenuesService } from '../services/venues.service';

@Controller('venues')
export class VenuesController {
  constructor(private readonly service: VenuesService) {}

  @Post()
  create(@Body() dto: CreateVenueDto) {
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
  update(@IdParam(idParamPipe()) id: number, @Body() dto: UpdateVenueDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.service.remove(id);
  }
}
