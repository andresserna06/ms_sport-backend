import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TournamentResponseDto } from '../dto/tournament-response.dto';

@Injectable()
export class TournamentsRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findOpenEnrollmentReport(): Promise<TournamentResponseDto[]> {
    const rows = await this.dataSource.query(
      `SELECT id,
              name,
              DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
              DATE_FORMAT(enrollment_deadline, '%Y-%m-%d') AS enrollmentDeadline
       FROM tournaments
       WHERE enrollment_deadline >= CURDATE()
         AND start_date > CURDATE()
       ORDER BY enrollment_deadline ASC`,
    );
    return rows as TournamentResponseDto[];
  }
}
