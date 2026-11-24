export class TeamResponseDto {
  id!: number;
  name!: string;
  city!: string;
  contactEmail!: string;
  foundedYear!: number | null;
  // Always sent by TeamMapper; optional so other modules can build a TeamResponseDto without it.
  logo?: string | null;
  active!: boolean;
}
