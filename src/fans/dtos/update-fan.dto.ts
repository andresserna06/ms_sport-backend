import { CreateFanDto } from './create-fan.dto';

// PUT replaces the whole record, so it takes the same fields and rules as POST.
export class UpdateFanDto extends CreateFanDto {}
