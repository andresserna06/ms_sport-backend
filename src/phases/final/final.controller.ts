import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FindPhasesQueryDto } from '../base/dto/find-phases-query.dto';
import { CreateFinalDto } from './dto/create-final.dto';
import { UpdateFinalDto } from './dto/update-final.dto';
import { FinalService } from './final.service';

@Controller('finals')
export class FinalController {
  constructor(private readonly finalService: FinalService) {}

  @Post()
  create(@Body() dto: CreateFinalDto) {
    return this.finalService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindPhasesQueryDto) {
    return this.finalService.findAll(query.tournamentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.finalService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFinalDto) {
    return this.finalService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.finalService.remove(id);
  }
}
