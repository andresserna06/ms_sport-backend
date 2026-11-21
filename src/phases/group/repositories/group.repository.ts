import { Team } from '../../../teams/entities/team.entity';
import { Group } from '../entities/group.entity';

export const GROUP_REPOSITORY = Symbol('GROUP_REPOSITORY');

export interface GroupRepository {
  findById(id: number): Promise<Group | null>;
  findAll(tournamentId?: number): Promise<Group[]>;
  save(group: Group): Promise<Group>;
  remove(group: Group): Promise<void>;
  findTeamById(teamId: number): Promise<Team | null>;
  findTeams(groupId: number): Promise<Team[]>;
  saveTeam(team: Team): Promise<Team>;
}
