import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import {
  DuplicateTeamNameError,
  TeamAssociations,
  TeamCityReportRow,
  TeamInUseError,
  TeamRepository,
} from './team.repository';

const DUPLICATE_ENTRY = 'ER_DUP_ENTRY';
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

  async save(team: Team): Promise<Team> {
    try {
      return await this.orm.save(team);
    } catch (error) {
      if (this.driverCode(error) === DUPLICATE_ENTRY) {
        throw new DuplicateTeamNameError();
      }
      throw error;
    }
  }

  async remove(team: Team): Promise<void> {
    try {
      await this.orm.remove(team);
    } catch (error) {
      const code = this.driverCode(error);
      if (code && REFERENCED_ROW.includes(code)) {
        throw new TeamInUseError();
      }
      throw error;
    }
  }

  // Every table that references a team. Each story that creates a new one
  // (registrations, group_teams...) adds its count here.
  async countAssociations(teamId: number): Promise<TeamAssociations> {
    const count = async (table: string, where: string, params: number[]) => {
      const rows = await this.dataSource.query(
        `SELECT COUNT(*) AS total FROM \`${table}\` WHERE ${where}`,
        params,
      );
      return Number(rows[0].total);
    };

    const [sports, contracts, matches, scoringEvents] = await Promise.all([
      count('team_sports', 'team_id = ?', [teamId]),
      count('player_contracts', 'team_id = ?', [teamId]),
      count('matches', 'home_team_id = ? OR away_team_id = ?', [
        teamId,
        teamId,
      ]),
      count('scoring_events', 'team_id = ?', [teamId]),
    ]);

    return { sports, contracts, matches, scoringEvents };
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

  private driverCode(error: unknown): string | undefined {
    const candidate = error as {
      code?: string;
      driverError?: { code?: string };
    };
    return candidate?.driverError?.code ?? candidate?.code;
  }
}
