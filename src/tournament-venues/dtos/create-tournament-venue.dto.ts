import { IsInt, IsPositive } from 'class-validator';

export class CreateTournamentVenueDto {
  @IsInt({ message: 'El campo torneo debe ser un número entero' })
  @IsPositive({ message: 'El campo torneo debe ser un id positivo' })
  tournamentId!: number;

  @IsInt({ message: 'El campo escenario debe ser un número entero' })
  @IsPositive({ message: 'El campo escenario debe ser un id positivo' })
  venueId!: number;
}
