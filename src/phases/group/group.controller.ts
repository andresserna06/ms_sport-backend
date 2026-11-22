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
  Query,
} from '@nestjs/common';
import { FindPhasesQueryDto } from '../base/dto/find-phases-query.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './group.service';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindPhasesQueryDto) {
    return this.groupService.findAll(query.tournamentId);
  }

  @Get(':id/teams')
  findTeams(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.findTeams(id);
  }

  @Post(':groupId/teams/:teamId')
  assignTeam(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.groupService.assignTeam(groupId, teamId);
  }

  @Delete(':groupId/teams/:teamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTeam(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.groupService.removeTeam(groupId, teamId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGroupDto) {
    return this.groupService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.remove(id);
  }
}
