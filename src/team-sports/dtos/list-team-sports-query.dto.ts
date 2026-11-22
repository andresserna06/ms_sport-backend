import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { toBoolean } from '../../common/transformers/query-transformers';

export class ListTeamSportsQueryDto {
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'El filtro active debe ser true o false' })
  active?: boolean;
}
