export class VenueResponseDto {
  id!: number;
  name!: string;
  city!: string;
  address!: string | null;
  capacity!: number | null;
  active!: boolean;
  parentVenueId!: number | null;
}
