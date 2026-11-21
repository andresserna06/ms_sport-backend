import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateMatchDto } from '../dto/create-match.dto';
import { MatchesService } from '../matches.service';

@Controller('phases/:phaseId/matches')
export class PhaseMatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(@Param('phaseId', ParseIntPipe) phaseId: number, @Body() dto: CreateMatchDto) {
    return this.matchesService.create(phaseId, dto);
  }

  @Get()
  findByPhase(@Param('phaseId', ParseIntPipe) phaseId: number) {
    return this.matchesService.findByPhase(phaseId);
  }
}
