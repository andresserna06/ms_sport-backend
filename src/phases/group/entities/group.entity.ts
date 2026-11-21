import { ChildEntity, OneToMany } from 'typeorm';
import { Team } from '../../../teams/entities/team.entity';
import { Phase } from '../../base/entities/phase.entity';

@ChildEntity('GROUP')
export class Group extends Phase {
  readonly phaseType = 'GROUP' as const;

  @OneToMany(() => Team, (team) => team.group)
  teams?: Team[];
}
