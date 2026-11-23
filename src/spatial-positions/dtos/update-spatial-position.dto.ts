import { CreateSpatialPositionDto } from './create-spatial-position.dto';

// PUT replaces the whole record, so it takes the same fields and rules as POST.
export class UpdateSpatialPositionDto extends CreateSpatialPositionDto {}
