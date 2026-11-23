import { CreateBetDto } from './create-bet.dto';

// PUT replaces the whole record, so it takes the same fields and rules as POST.
export class UpdateBetDto extends CreateBetDto {}
