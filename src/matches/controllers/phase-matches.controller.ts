import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateMatchDto } from '../dto/create-match.dto';
import { MatchesService } from '../matches.service';

@Controller('phases/:phaseId/matches')
export class PhaseMatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() dto: CreateMatchDto,
    @Headers('authorization') authorizationHeader?: string,
  ) {
    return this.matchesService.create(phaseId, dto, authorizationHeader);
  }

  @Get()
  findByPhase(@Param('phaseId', ParseIntPipe) phaseId: number) {
    return this.matchesService.findByPhase(phaseId);
  }
}
