import { ChildEntity } from 'typeorm';
import { Phase } from '../../base/entities/phase.entity';

@ChildEntity('FINAL')
export class Final extends Phase {}
