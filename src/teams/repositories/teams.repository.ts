import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const TEAM_ASSOCIATIONS: { table: string; column: string }[] = [
  { table: 'player_contracts', column: 'team_id' },
];

@Injectable()
export class TeamsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

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

  async findActiveByCityReport(): Promise<
    { city: string; totalTeams: number }[]
  > {
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
