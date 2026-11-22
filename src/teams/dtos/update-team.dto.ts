import { CreateTeamDto } from './create-team.dto';

// PUT replaces the whole team, so it takes the same fields and rules as POST.
export class UpdateTeamDto extends CreateTeamDto {}
