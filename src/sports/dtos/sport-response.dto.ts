export class SportSummaryDto {
  id!: number;
  name!: string;
}

export class SportResponseDto {
  id!: number;
  name!: string;
  description!: string | null;
  active!: boolean;
  parentSportId!: number | null;
  parentSport!: SportSummaryDto | null;
  subSportsCount!: number;
}
