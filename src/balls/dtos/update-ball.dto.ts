import { CreateBallDto } from './create-ball.dto';

// PUT replaces the whole record, so it takes the same fields and rules as POST.
export class UpdateBallDto extends CreateBallDto {}
