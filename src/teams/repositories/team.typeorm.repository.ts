import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import {
  TeamCityReportRow,
  TeamInUseError,
  TeamRepository,
} from './team.repository';

// Tables that reference a team. Add the new ones here as each story creates
// them (contracts, registrations, matches...).
const TEAM_ASSOCIATIONS: { table: string; column: string }[] = [
  { table: 'team_sports', column: 'team_id' },
];

const REFERENCED_ROW = ['ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'];

@Injectable()
export class TeamTypeOrmRepository implements TeamRepository {
  constructor(
    @InjectRepository(Team) private readonly orm: Repository<Team>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findById(id: number): Promise<Team | null> {
    return this.orm.findOne({ where: { id } });
  }

  findByName(name: string): Promise<Team | null> {
    return this.orm.findOne({ where: { name } });
  }

  findAll(active?: boolean): Promise<Team[]> {
    return this.orm.find({
      where: active === undefined ? {} : { active },
      order: { name: 'ASC' },
    });
  }

  save(team: Team): Promise<Team> {
    return this.orm.save(team);
  }

  async remove(team: Team): Promise<void> {
    try {
      await this.orm.remove(team);
    } catch (error) {
      const candidate = error as {
        code?: string;
        driverError?: { code?: string };
      };
      const code = candidate?.driverError?.code ?? candidate?.code;
      if (code && REFERENCED_ROW.includes(code)) {
        throw new TeamInUseError();
      }
      throw error;
    }
  }

  async countAssociations(teamId: number): Promise<number> {
    let total = 0;

    for (const { table, column } of TEAM_ASSOCIATIONS) {
      const rows = await this.dataSource.query(
        `SELECT COUNT(*) AS total FROM \`${table}\` WHERE \`${column}\` = ?`,
        [teamId],
      );
      total += Number(rows[0].total);
    }

    return total;
  }

  async findActiveByCityReport(): Promise<TeamCityReportRow[]> {
    const rows = await this.dataSource.query(
      `SELECT city,
              COUNT(*) AS totalTeams
       FROM teams
       WHERE active = 1
       GROUP BY city
       ORDER BY totalTeams DESC, city ASC`,
    );
    return rows.map((row: { city: string; totalTeams: string | number }) => ({
      city: row.city,
      totalTeams: Number(row.totalTeams),
    }));
  }
}
