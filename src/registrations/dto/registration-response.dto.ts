export class RegistrationSummaryDto {
  id!: number;
  name!: string;
}

export class RegistrationResponseDto {
  id!: number;
  registeredAt!: Date;
  team!: RegistrationSummaryDto;
  tournament!: RegistrationSummaryDto;
}
