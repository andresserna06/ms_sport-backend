import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePlayerContractDto } from '../dtos/create-player-contract.dto';
import { FindContractsQueryDto } from '../dtos/find-contracts-query.dto';
import {
  PlayerContractResponseDto,
  PlayerTeamContractResponseDto,
  TeamPlayerContractResponseDto,
} from '../dtos/player-contract-response.dto';
import { PlayerContractService } from '../services/player-contract.service';

@Controller()
export class PlayerContractController {
  constructor(private readonly contractService: PlayerContractService) {}

  @Post('teams/:teamId/contracts')
  create(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: CreatePlayerContractDto,
  ): Promise<PlayerContractResponseDto> {
    return this.contractService.create(teamId, dto);
  }

  @Patch('contracts/:id/end')
  endContract(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerContractResponseDto> {
    return this.contractService.endContract(id);
  }

  @Get('teams/:id/players')
  findPlayersByTeam(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindContractsQueryDto,
  ): Promise<TeamPlayerContractResponseDto[]> {
    return this.contractService.findPlayersByTeam(id, query);
  }

  @Get('players/:id/teams')
  findTeamsByPlayer(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindContractsQueryDto,
  ): Promise<PlayerTeamContractResponseDto[]> {
    return this.contractService.findTeamsByPlayer(id, query);
  }
}
