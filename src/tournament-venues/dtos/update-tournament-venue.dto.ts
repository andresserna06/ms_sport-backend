import { CreateTournamentVenueDto } from './create-tournament-venue.dto';

// PUT replaces the whole record, so it takes the same fields and rules as POST.
export class UpdateTournamentVenueDto extends CreateTournamentVenueDto {}
