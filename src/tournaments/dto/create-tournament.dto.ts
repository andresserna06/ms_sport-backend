import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @Matches(DATE_FORMAT, { message: 'startDate must be in YYYY-MM-DD format' })
  startDate!: string;

  @Matches(DATE_FORMAT, {
    message: 'enrollmentDeadline must be in YYYY-MM-DD format',
  })
  enrollmentDeadline!: string;
}
