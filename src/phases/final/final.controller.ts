import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
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
  findAll() {
    return this.finalService.findAll();
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.finalService.remove(id);
  }
}
