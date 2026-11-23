import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { IdParam } from '../../common/decorators/id-param.decorator';
import { idParamPipe } from '../../common/pipes/id-param.pipe';
import { CreateFanDto } from '../dtos/create-fan.dto';
import { UpdateFanDto } from '../dtos/update-fan.dto';
import { FansService } from '../services/fans.service';

@Controller('fans')
export class FansController {
  constructor(private readonly service: FansService) {}

  @Post()
  create(
    @Body() dto: CreateFanDto,
    @Headers('authorization') authorizationHeader?: string,
  ) {
    return this.service.create(dto, authorizationHeader);
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
  update(@IdParam(idParamPipe()) id: number, @Body() dto: UpdateFanDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.service.remove(id);
  }
}
