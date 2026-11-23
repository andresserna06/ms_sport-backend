import { CreateVenueDto } from './create-venue.dto';

// PUT replaces the whole record, so it takes the same fields and rules as POST.
export class UpdateVenueDto extends CreateVenueDto {}
