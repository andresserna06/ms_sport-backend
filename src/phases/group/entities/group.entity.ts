import { ChildEntity } from 'typeorm';
import { Phase } from '../../base/entities/phase.entity';

@ChildEntity('GROUP')
export class Group extends Phase {
  readonly phaseType = 'GROUP' as const;
}