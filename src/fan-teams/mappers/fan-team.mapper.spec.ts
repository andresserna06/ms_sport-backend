import { FanTeam } from '../entities/fan-team.entity';
import { FanTeamMapper } from './fan-team.mapper';

describe('FanTeamMapper', () => {
  const mapper = new FanTeamMapper();
  const dto = { fanId: 1, teamId: 1 };

  it('creates an entity from the DTO', () => {
    const entity = mapper.toEntity(dto);

    expect(entity).toBeInstanceOf(FanTeam);
    expect(entity.fanId).toBe(1);
    expect(entity.teamId).toBe(1);
  });

  it('replaces the editable fields and keeps the id', () => {
    const existing = Object.assign(new FanTeam(), { id: 7 });

    const replaced = mapper.replaceEntity(existing, dto);

    expect(replaced.id).toBe(7);
  });

  it('maps an entity to the response and to a list', () => {
    const entity = Object.assign(mapper.toEntity(dto), { id: 3 });

    const response = mapper.toResponseDto(entity);

    expect(response.id).toBe(3);
    expect(mapper.toResponseDtoList([entity])).toEqual([response]);
  });
});
