import { Injectable } from '@nestjs/common';
import { PlayerContractService } from '../../player-contracts/services/player-contract.service';
import { PlayerSkillService } from '../../player-skills/services/player-skill.service';
import { PlayerService } from '../../players/services/player.service';
import { PlayerProfileResponseDto } from '../dtos/player-profile-response.dto';
import { PlayerProfileMapper } from '../mappers/player-profile.mapper';

const NO_TEAMS_MESSAGE = 'El jugador no tiene equipos asociados';
const NO_SKILLS_MESSAGE = 'El jugador no tiene habilidades registradas';

@Injectable()
export class PlayerProfileService {
  constructor(
    private readonly playerService: PlayerService,
    private readonly contractService: PlayerContractService,
    private readonly playerSkillService: PlayerSkillService,
    private readonly profileMapper: PlayerProfileMapper,
  ) {}

  async getProfile(playerId: number): Promise<PlayerProfileResponseDto> {
    const player = await this.playerService.findOne(playerId);

    const [teams, skills] = await Promise.all([
      this.contractService.findTeamsByPlayer(playerId, {}),
      this.playerSkillService.findSkillsByPlayer(playerId),
    ]);

    const teamsMessage = teams.length === 0 ? NO_TEAMS_MESSAGE : null;
    const skillsMessage = skills.length === 0 ? NO_SKILLS_MESSAGE : null;

    return this.profileMapper.toResponseDto(
      player,
      teams,
      teamsMessage,
      skills,
      skillsMessage,
    );
  }
}
