import { CreateTournamentDto } from './create-tournament.dto';

// PUT replaces the whole tournament, so it takes the same fields and rules as
// POST.
export class UpdateTournamentDto extends CreateTournamentDto {}
