import { CreatePaymentMethodDto } from './create-payment-method.dto';

// PUT replaces the whole record, so it takes the same fields and rules as POST.
export class UpdatePaymentMethodDto extends CreatePaymentMethodDto {}
