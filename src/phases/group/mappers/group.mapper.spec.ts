import { Team } from '../../../teams/entities/team.entity';
import { Tournament } from '../../../tournaments/entities/tournament.entity';
import { CreateGroupDto } from '../dto/create-group.dto';
import { Group } from '../entities/group.entity';
import { GroupMapper } from './group.mapper';

describe('GroupMapper', () => {
  let mapper: GroupMapper;

  beforeEach(() => {
    mapper = new GroupMapper();
  });

  it('should map the create DTO and tournament id to a Group entity', () => {
    const dto = Object.assign(new CreateGroupDto(), {
      name: 'Group A',
      order: 1,
      tournamentId: 7,
    });

    const entity = mapper.toEntity(dto, 7);

    expect(entity).toBeInstanceOf(Group);
    expect(entity.name).toBe('Group A');
    expect(entity.order).toBe(1);
    expect(entity.tournament?.id).toBe(7);
  });

  it('should map a Group entity with teams to the response DTO', () => {
    const group = Object.assign(new Group(), {
      id: 3,
      name: 'Group A',
      order: 1,
      tournament: Object.assign(new Tournament(), { id: 7 }),
      teams: [
        Object.assign(new Team(), { id: 1, name: 'Lions' }),
        Object.assign(new Team(), { id: 2, name: 'Tigers' }),
      ],
    });

    expect(mapper.toResponseDto(group)).toEqual({
      id: 3,
      name: 'Group A',
      order: 1,
      tournamentId: 7,
      phaseType: 'GROUP',
      teams: [
        { id: 1, name: 'Lions' },
        { id: 2, name: 'Tigers' },
      ],
    });
  });

  it('should omit teams when the relation was not loaded', () => {
    const group = Object.assign(new Group(), {
      id: 3,
      name: 'Group A',
      order: 1,
      tournament: Object.assign(new Tournament(), { id: 7 }),
    });

    expect(mapper.toResponseDto(group).teams).toBeUndefined();
  });

  it('should update only the provided fields', () => {
    const group = Object.assign(new Group(), {
      id: 3,
      name: 'Group A',
      order: 1,
      tournament: Object.assign(new Tournament(), { id: 7 }),
    });

    mapper.mergeEntity(group, { order: 2 });

    expect(group.name).toBe('Group A');
    expect(group.order).toBe(2);
  });
});
