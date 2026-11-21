import { Injectable } from '@nestjs/common';
import { PlayerTeamContractResponseDto } from '../../player-contracts/dtos/player-contract-response.dto';
import { PlayerAssignedSkillResponseDto } from '../../player-skills/dtos/player-skill-response.dto';
import { PlayerResponseDto } from '../../players/dtos/player-response.dto';
import { PlayerProfileResponseDto } from '../dtos/player-profile-response.dto';

@Injectable()
export class PlayerProfileMapper {
  toResponseDto(
    player: PlayerResponseDto,
    teams: PlayerTeamContractResponseDto[],
    teamsMessage: string | null,
    skills: PlayerAssignedSkillResponseDto[],
    skillsMessage: string | null,
  ): PlayerProfileResponseDto {
    const dto = new PlayerProfileResponseDto();
    dto.player = player;
    dto.teams = teams;
    dto.teamsMessage = teamsMessage;
    dto.skills = skills;
    dto.skillsMessage = skillsMessage;
    return dto;
  }
}
