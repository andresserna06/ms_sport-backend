export class PlayerResponseDto {
  id!: number;
  userId!: number;
  document!: string;
  position!: string | null;
  jerseyNumber!: number | null;
  active!: boolean;
}
