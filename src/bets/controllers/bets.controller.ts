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
import { CreateBetDto } from '../dtos/create-bet.dto';
import { UpdateBetDto } from '../dtos/update-bet.dto';
import { BetsService } from '../services/bets.service';

@Controller('bets')
export class BetsController {
  constructor(private readonly service: BetsService) {}

  @Post()
  create(@Body() dto: CreateBetDto) {
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
  update(@IdParam(idParamPipe()) id: number, @Body() dto: UpdateBetDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@IdParam(idParamPipe()) id: number) {
    return this.service.remove(id);
  }
}
