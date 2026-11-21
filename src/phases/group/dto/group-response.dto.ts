import { PhaseResponseDto } from '../../base/dto/phase-response.dto';
import { GroupTeamResponseDto } from './group-team-response.dto';

export class GroupResponseDto extends PhaseResponseDto {
  teams?: GroupTeamResponseDto[];
}
