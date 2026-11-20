import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PhasesRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findCountByTypeReport(): Promise<{ phaseType: string; total: number }[]> {
    const rows = await this.dataSource.query(
      `SELECT phase_type AS phaseType, COUNT(*) AS total
       FROM phases
       GROUP BY phase_type
       ORDER BY phase_type`,
    );
    return rows.map((row: { phaseType: string; total: string | number }) => ({
      phaseType: row.phaseType,
      total: Number(row.total),
    }));
  }
}
