import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { FindPhasesQueryDto } from './dto/find-phases-query.dto';
import { PhasesService } from './phases.service';

@Controller('phases')
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @Get()
  findAll(@Query() query: FindPhasesQueryDto) {
    return this.phasesService.findAll(query.tournamentId);
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
