export class TournamentResponseDto {
  id!: number;
  name!: string;
  sport!: { id: number; name: string };
  startDate!: string;
  enrollmentDeadline!: string;
  active!: boolean;
}
