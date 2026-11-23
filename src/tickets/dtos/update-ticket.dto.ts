import { CreateTicketDto } from './create-ticket.dto';

// PUT replaces the whole record, so it takes the same fields and rules as POST.
export class UpdateTicketDto extends CreateTicketDto {}
