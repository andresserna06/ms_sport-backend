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
  Put,
  Query,
} from '@nestjs/common';
import { CreateSkillDto } from '../dtos/create-skill.dto';
import { FindSkillsQueryDto } from '../dtos/find-skills-query.dto';
import { SkillResponseDto } from '../dtos/skill-response.dto';
import { UpdateSkillDto } from '../dtos/update-skill.dto';
import { SkillService } from '../services/skill.service';

@Controller('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Post()
  create(@Body() dto: CreateSkillDto): Promise<SkillResponseDto> {
    return this.skillService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindSkillsQueryDto): Promise<SkillResponseDto[]> {
    return this.skillService.findAll(query.name);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<SkillResponseDto> {
    return this.skillService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillResponseDto> {
    return this.skillService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.skillService.remove(id);
  }
}
