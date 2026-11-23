import { RegistrationStatus } from '../entities/registration.entity';

export class RegistrationSummaryDto {
  id!: number;
  name!: string;
}

export class RegistrationResponseDto {
  id!: number;
  registeredAt!: Date;
  withdrawnAt!: Date | null;
  status!: RegistrationStatus;
  team!: RegistrationSummaryDto;
  tournament!: RegistrationSummaryDto;
}
