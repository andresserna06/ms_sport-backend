import { CreateSportDto } from './create-sport.dto';

// PUT replaces the whole resource: an omitted description or parentSportId
// is stored as null. The state (active) only changes via activate/deactivate.
export class UpdateSportDto extends CreateSportDto {}
