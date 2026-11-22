import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamSport } from '../entities/team-sport.entity';
import {
  DuplicateTeamSportError,
  TeamSportRepository,
  TeamSportTargetMissingError,
} from './team-sport.repository';

const DUPLICATE_ENTRY = 'ER_DUP_ENTRY';
const MISSING_REFERENCED_ROW = [
  'ER_NO_REFERENCED_ROW',
  'ER_NO_REFERENCED_ROW_2',
];

@Injectable()
export class TeamSportTypeOrmRepository implements TeamSportRepository {
  constructor(
    @InjectRepository(TeamSport) private readonly orm: Repository<TeamSport>,
  ) {}

  findPair(teamId: number, sportId: number): Promise<TeamSport | null> {
    return this.orm.findOne({ where: { teamId, sportId } });
  }

  findByTeam(teamId: number, active?: boolean): Promise<TeamSport[]> {
    const query = this.orm
      .createQueryBuilder('ts')
      .innerJoinAndSelect('ts.sport', 'sport')
      .where('ts.teamId = :teamId', { teamId });
    if (active !== undefined) {
      query.andWhere('sport.active = :active', { active });
    }
    return query.orderBy('sport.name', 'ASC').getMany();
  }

  findBySport(sportId: number, active?: boolean): Promise<TeamSport[]> {
    const query = this.orm
      .createQueryBuilder('ts')
      .innerJoinAndSelect('ts.team', 'team')
      .where('ts.sportId = :sportId', { sportId });
    if (active !== undefined) {
      query.andWhere('team.active = :active', { active });
    }
    return query.orderBy('team.name', 'ASC').getMany();
  }

  async create(teamId: number, sportId: number): Promise<TeamSport> {
    try {
      return await this.orm.save(this.orm.create({ teamId, sportId }));
    } catch (error) {
      const candidate = error as {
        code?: string;
        driverError?: { code?: string };
      };
      const code = candidate?.driverError?.code ?? candidate?.code;
      if (code === DUPLICATE_ENTRY) throw new DuplicateTeamSportError();
      if (code && MISSING_REFERENCED_ROW.includes(code)) {
        throw new TeamSportTargetMissingError();
      }
      throw error;
    }
  }

  async remove(association: TeamSport): Promise<void> {
    await this.orm.remove(association);
  }
}
