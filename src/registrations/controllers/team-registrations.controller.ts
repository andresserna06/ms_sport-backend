import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RegistrationsService } from '../registrations.service';

@Controller('teams/:teamId/tournaments')
export class TeamRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get()
  findTournamentsByTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.registrationsService.findTournamentsByTeam(teamId);
  }
}
