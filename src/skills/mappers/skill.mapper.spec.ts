import { CreateSkillDto } from '../dtos/create-skill.dto';
import { UpdateSkillDto } from '../dtos/update-skill.dto';
import { Skill } from '../entities/skill.entity';
import { SkillMapper } from './skill.mapper';

describe('SkillMapper', () => {
  let mapper: SkillMapper;

  beforeEach(() => {
    mapper = new SkillMapper();
  });

  it('should map CreateSkillDto to Skill entity trimming spaces', () => {
    const dto: CreateSkillDto = {
      name: '  Speed  ',
      description: '  Fast movement across the field  ',
    };

    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(Skill);
    expect(entity.name).toBe('Speed');
    expect(entity.description).toBe('Fast movement across the field');
  });

  it('should merge UpdateSkillDto into an existing Skill entity', () => {
    const entity = new Skill();
    entity.id = 1;
    entity.name = 'Speed';
    entity.description = 'Initial description';

    const dto: UpdateSkillDto = {
      name: '  Stamina  ',
      description: '  Sustained aerobic capacity  ',
    };

    const updated = mapper.mergeEntity(entity, dto);

    expect(updated.id).toBe(1);
    expect(updated.name).toBe('Stamina');
    expect(updated.description).toBe('Sustained aerobic capacity');
  });

  it('should map a Skill entity to SkillResponseDto', () => {
    const entity = new Skill();
    entity.id = 3;
    entity.name = 'Accuracy';
    entity.description = 'Precision in passes and shots';

    const dto = mapper.toResponseDto(entity);

    expect(dto).toEqual({
      id: 3,
      name: 'Accuracy',
      description: 'Precision in passes and shots',
    });
  });

  it('should map a list of Skill entities to SkillResponseDto list', () => {
    const s1 = Object.assign(new Skill(), {
      id: 1,
      name: 'Speed',
      description: 'Desc 1',
    });
    const s2 = Object.assign(new Skill(), {
      id: 2,
      name: 'Stamina',
      description: 'Desc 2',
    });

    const result = mapper.toResponseDtoList([s1, s2]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 1, name: 'Speed', description: 'Desc 1' });
    expect(result[1]).toEqual({
      id: 2,
      name: 'Stamina',
      description: 'Desc 2',
    });
  });
});
