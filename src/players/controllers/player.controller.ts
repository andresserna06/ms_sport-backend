import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreatePlayerDto } from '../dtos/create-player.dto';
import { FindPlayersQueryDto } from '../dtos/find-players-query.dto';
import { PlayerResponseDto } from '../dtos/player-response.dto';
import { UpdatePlayerDto } from '../dtos/update-player.dto';
import { PlayerService } from '../services/player.service';

@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post()
  create(@Body() dto: CreatePlayerDto): Promise<PlayerResponseDto> {
    return this.playerService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindPlayersQueryDto): Promise<PlayerResponseDto[]> {
    return this.playerService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PlayerResponseDto> {
    return this.playerService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlayerDto,
  ): Promise<PlayerResponseDto> {
    return this.playerService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlayerResponseDto> {
    return this.playerService.deactivate(id);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number): Promise<PlayerResponseDto> {
    return this.playerService.activate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.playerService.remove(id);
  }
}
