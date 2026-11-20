import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { CreateSkillDto } from '../dtos/create-skill.dto';
import { SkillResponseDto } from '../dtos/skill-response.dto';
import { UpdateSkillDto } from '../dtos/update-skill.dto';
import { Skill } from '../entities/skill.entity';
import { SkillMapper } from '../mappers/skill.mapper';
import {
  SKILL_DEPENDENCIES_CHECKER,
  type SkillDependenciesChecker,
} from '../repositories/skill-dependencies.port';
import {
  SKILL_REPOSITORY,
  type SkillRepository,
} from '../repositories/skill.repository';

@Injectable()
export class SkillService {
  constructor(
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    @Inject(SKILL_DEPENDENCIES_CHECKER)
    private readonly dependenciesChecker: SkillDependenciesChecker,
    private readonly skillMapper: SkillMapper,
  ) {}

  async create(dto: CreateSkillDto): Promise<SkillResponseDto> {
    const entity = this.skillMapper.toEntity(dto);
    await this.ensureNameIsAvailable(entity.name);

    const saved = await this.skillRepository.save(entity);
    return this.skillMapper.toResponseDto(saved);
  }

  async findAll(name?: string): Promise<SkillResponseDto[]> {
    const skills = await this.skillRepository.findAll(name);
    return this.skillMapper.toResponseDtoList(skills);
  }

  async findOne(id: number): Promise<SkillResponseDto> {
    const skill = await this.getSkillOrFail(id);
    return this.skillMapper.toResponseDto(skill);
  }

  async update(id: number, dto: UpdateSkillDto): Promise<SkillResponseDto> {
    const skill = await this.getSkillOrFail(id);
    await this.ensureNameIsAvailable(dto.name.trim(), id);
    const updated = this.skillMapper.mergeEntity(skill, dto);

    const saved = await this.skillRepository.save(updated);
    return this.skillMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const skill = await this.getSkillOrFail(id);

    const hasAssociatedPlayers =
      await this.dependenciesChecker.hasAssociatedPlayers(id);
    if (hasAssociatedPlayers) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        `No se puede eliminar la habilidad ${skill.name} porque tiene jugadores asociados`,
      );
    }

    await this.skillRepository.remove(skill);
  }

  private async getSkillOrFail(id: number): Promise<Skill> {
    const skill = await this.skillRepository.findById(id);
    if (!skill) {
      throw new ApplicationException(
        ErrorCase.NOT_FOUND,
        `No existe una habilidad con el id ${id}`,
      );
    }
    return skill;
  }

  private async ensureNameIsAvailable(
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const exists = await this.skillRepository.existsByName(name, excludeId);
    if (exists) {
      throw new ApplicationException(
        ErrorCase.ALREADY_EXISTS,
        `Ya existe una habilidad con el nombre ${name}`,
      );
    }
  }
}
