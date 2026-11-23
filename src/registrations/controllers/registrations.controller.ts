import { Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { RegistrationsService } from '../registrations.service';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Patch(':id/confirm')
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.registrationsService.confirm(id);
  }

  @Patch(':id/withdraw')
  withdraw(@Param('id', ParseIntPipe) id: number) {
    return this.registrationsService.withdraw(id);
  }
}
