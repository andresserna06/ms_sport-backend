import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

const parseQueryBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true) {
    return true;
  }
  if (value === 'false' || value === false) {
    return false;
  }
  return value;
};

export class FindContractsQueryDto {
  @IsOptional()
  @Transform(parseQueryBoolean)
  @IsBoolean({ message: 'El filtro current debe ser true o false' })
  current?: boolean;
}
