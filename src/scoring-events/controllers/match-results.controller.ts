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
  Put,
} from '@nestjs/common';
import { MatchResponseDto } from '../../matches/dto/match-response.dto';
import { CreateScoringEventDto } from '../dtos/create-scoring-event.dto';
import { FinishMatchDto } from '../dtos/finish-match.dto';
import { ScoringEventResponseDto } from '../dtos/scoring-event-response.dto';
import { UpdateMatchResultDto } from '../dtos/update-match-result.dto';
import { UpdateScoringEventDto } from '../dtos/update-scoring-event.dto';
import { MatchResultsService } from '../services/match-results.service';

@Controller()
export class MatchResultsController {
  constructor(private readonly matchResultsService: MatchResultsService) {}

  @Put('matches/:id/result')
  updateResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMatchResultDto,
  ): Promise<MatchResponseDto> {
    return this.matchResultsService.updateResult(id, dto);
  }

  @Patch('matches/:id/finish')
  finishMatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto?: FinishMatchDto,
  ): Promise<MatchResponseDto> {
    return this.matchResultsService.finishMatch(id, dto);
  }

  @Post('matches/:id/scoring-events')
  createScoringEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateScoringEventDto,
  ): Promise<ScoringEventResponseDto> {
    return this.matchResultsService.createScoringEvent(id, dto);
  }

  @Get('matches/:id/scoring-events')
  findScoringEventsByMatch(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ScoringEventResponseDto[]> {
    return this.matchResultsService.findScoringEventsByMatch(id);
  }

  @Put('scoring-events/:id')
  updateScoringEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScoringEventDto,
  ): Promise<ScoringEventResponseDto> {
    return this.matchResultsService.updateScoringEvent(id, dto);
  }

  @Delete('scoring-events/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeScoringEvent(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.matchResultsService.removeScoringEvent(id);
  }
}
