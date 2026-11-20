import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MatchStatus } from '../entities/match.entity';
import { MatchResponseDto } from '../dto/match-response.dto';

@Injectable()
export class MatchesRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findByStatusReport(status: MatchStatus): Promise<MatchResponseDto[]> {
    const rows = await this.dataSource.query(
      `SELECT id,
              scheduled_at AS scheduledAt,
              status,
              home_score AS homeScore,
              away_score AS awayScore,
              phase_id AS phaseId
       FROM matches
       WHERE status = ?
       ORDER BY scheduled_at ASC`,
      [status],
    );
    return rows as MatchResponseDto[];
  }
}
