import { ChildEntity, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { Phase } from '../../base/entities/phase.entity';
import type { Team } from '../../../teams/entities/team.entity';

@ChildEntity('GROUP')
export class Group extends Phase {
  readonly phaseType = 'GROUP' as const;

  @OneToMany('Team', 'group')
  teams?: Relation<Team[]>;
}
