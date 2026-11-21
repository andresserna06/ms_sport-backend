import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { PlayerService } from '../../players/services/player.service';
import { SkillService } from '../../skills/services/skill.service';
import { AssignPlayerSkillDto } from '../dtos/assign-player-skill.dto';
import {
  PlayerAssignedSkillResponseDto,
  PlayerSkillResponseDto,
  SkillAssignedPlayerResponseDto,
} from '../dtos/player-skill-response.dto';
import { PlayerSkillMapper } from '../mappers/player-skill.mapper';
import {
  PLAYER_SKILL_REPOSITORY,
  type PlayerSkillRepository,
} from '../repositories/player-skill.repository';

@Injectable()
export class PlayerSkillService {
  constructor(
    @Inject(PLAYER_SKILL_REPOSITORY)
    private readonly playerSkillRepository: PlayerSkillRepository,
    private readonly playerService: PlayerService,
    private readonly skillService: SkillService,
    private readonly playerSkillMapper: PlayerSkillMapper,
  ) {}

  async assign(
    playerId: number,
    skillId: number,
    dto?: AssignPlayerSkillDto,
  ): Promise<PlayerSkillResponseDto> {
    const player = await this.playerService.findOne(playerId);
    await this.skillService.findOne(skillId);

    if (!player.active) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se pueden asignar habilidades al jugador ${playerId} porque está inactivo`,
      );
    }

    const existing = await this.playerSkillRepository.findByPlayerAndSkill(
      playerId,
      skillId,
    );
    if (existing) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `El jugador ${playerId} ya tiene asignada la habilidad ${skillId}`,
      );
    }

    const entity = this.playerSkillMapper.toEntity(playerId, skillId, dto);
    const saved = await this.playerSkillRepository.save(entity);
    return this.playerSkillMapper.toResponseDto(saved);
  }

  async remove(playerId: number, skillId: number): Promise<void> {
    await this.playerService.findOne(playerId);
    await this.skillService.findOne(skillId);

    const existing = await this.playerSkillRepository.findByPlayerAndSkill(
      playerId,
      skillId,
    );
    if (!existing) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `El jugador ${playerId} no tiene asignada la habilidad ${skillId}`,
      );
    }

    await this.playerSkillRepository.remove(existing);
  }

  async findSkillsByPlayer(
    playerId: number,
  ): Promise<PlayerAssignedSkillResponseDto[]> {
    await this.playerService.findOne(playerId);
    const records =
      await this.playerSkillRepository.findSkillsByPlayerId(playerId);
    return this.playerSkillMapper.toPlayerAssignedSkillDtoList(records);
  }

  async findPlayersBySkill(
    skillId: number,
  ): Promise<SkillAssignedPlayerResponseDto[]> {
    await this.skillService.findOne(skillId);
    const records =
      await this.playerSkillRepository.findPlayersBySkillId(skillId);
    return this.playerSkillMapper.toSkillAssignedPlayerDtoList(records);
  }
}
