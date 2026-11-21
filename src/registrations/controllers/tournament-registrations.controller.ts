import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { RegistrationsService } from '../registrations.service';

@Controller('tournaments/:tournamentId/registrations')
export class TournamentRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  create(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Body() dto: CreateRegistrationDto,
  ) {
    return this.registrationsService.create(tournamentId, dto);
  }

  @Get()
  findByTournament(@Param('tournamentId', ParseIntPipe) tournamentId: number) {
    return this.registrationsService.findByTournament(tournamentId);
  }

  @Delete(':teamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.registrationsService.remove(tournamentId, teamId);
  }
}
