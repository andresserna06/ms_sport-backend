import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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

  @Patch(':teamId/withdraw')
  withdraw(
    @Param('tournamentId', ParseIntPipe) tournamentId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.registrationsService.withdrawByTournamentAndTeam(tournamentId, teamId);
  }
}
