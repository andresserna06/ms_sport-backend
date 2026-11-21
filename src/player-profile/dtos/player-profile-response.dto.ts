import { PlayerTeamContractResponseDto } from '../../player-contracts/dtos/player-contract-response.dto';
import { PlayerAssignedSkillResponseDto } from '../../player-skills/dtos/player-skill-response.dto';
import { PlayerResponseDto } from '../../players/dtos/player-response.dto';

export class PlayerProfileResponseDto {
  player!: PlayerResponseDto;
  teams!: PlayerTeamContractResponseDto[];
  teamsMessage!: string | null;
  skills!: PlayerAssignedSkillResponseDto[];
  skillsMessage!: string | null;
}
