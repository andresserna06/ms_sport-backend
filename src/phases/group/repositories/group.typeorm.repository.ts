import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Team } from '../../../teams/entities/team.entity';
import { Group } from '../entities/group.entity';
import { GroupRepository } from './group.repository';

@Injectable()
export class GroupTypeOrmRepository implements GroupRepository {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findById(id: number): Promise<Group | null> {
    return this.groupsRepository.findOne({
      where: { id },
      relations: { tournament: true, teams: true },
    });
  }

  findAll(tournamentId?: number): Promise<Group[]> {
    return this.groupsRepository.find({
      where:
        tournamentId === undefined ? {} : { tournament: { id: tournamentId } },
      relations: { tournament: true, teams: true },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  save(group: Group): Promise<Group> {
    return this.groupsRepository.save(group);
  }

  async remove(group: Group): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        'UPDATE teams SET group_id = NULL WHERE group_id = ?',
        [group.id],
      );
      await manager.getRepository(Group).remove(group);
    });
  }

  findTeamById(teamId: number): Promise<Team | null> {
    return this.teamsRepository.findOne({
      where: { id: teamId },
      relations: { group: { tournament: true } },
    });
  }

  findTeams(groupId: number): Promise<Team[]> {
    return this.teamsRepository.find({
      where: { group: { id: groupId } },
      order: { name: 'ASC' },
    });
  }

  saveTeam(team: Team): Promise<Team> {
    return this.teamsRepository.save(team);
  }
}
