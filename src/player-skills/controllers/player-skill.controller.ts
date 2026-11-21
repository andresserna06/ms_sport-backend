import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AssignPlayerSkillDto } from '../dtos/assign-player-skill.dto';
import {
  PlayerAssignedSkillResponseDto,
  PlayerSkillResponseDto,
  SkillAssignedPlayerResponseDto,
} from '../dtos/player-skill-response.dto';
import { PlayerSkillService } from '../services/player-skill.service';

@Controller()
export class PlayerSkillController {
  constructor(private readonly playerSkillService: PlayerSkillService) {}

  @Post('players/:playerId/skills/:skillId')
  assign(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Param('skillId', ParseIntPipe) skillId: number,
    @Body() dto?: AssignPlayerSkillDto,
  ): Promise<PlayerSkillResponseDto> {
    return this.playerSkillService.assign(playerId, skillId, dto);
  }

  @Delete('players/:playerId/skills/:skillId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Param('skillId', ParseIntPipe) skillId: number,
  ): Promise<void> {
    return this.playerSkillService.remove(playerId, skillId);
  }

  @Get('players/:id/skills')
  findSkillsByPlayer(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerAssignedSkillResponseDto[]> {
    return this.playerSkillService.findSkillsByPlayer(id);
  }

  @Get('skills/:id/players')
  findPlayersBySkill(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SkillAssignedPlayerResponseDto[]> {
    return this.playerSkillService.findPlayersBySkill(id);
  }
}
