import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PhasesService } from './phases.service';

@Controller('phases')
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @Get()
  findAll() {
    return this.phasesService.findAll();
  }

  @Get('reports/count-by-type')
  countByTypeReport() {
    return this.phasesService.getCountByTypeReport();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.phasesService.findOne(id);
  }
}
