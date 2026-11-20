import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class PhaseFieldsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(1)
  order!: number;
}
