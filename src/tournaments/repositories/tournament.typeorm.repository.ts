import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { Phase } from '../../phases/base/entities/phase.entity';
import { Tournament } from '../entities/tournament.entity';
import {
  DuplicateTournamentNameError,
  TournamentDependencies,
  TournamentFilter,
  TournamentInUseError,
  TournamentRepository,
  TournamentSportMissingError,
} from './tournament.repository';

const DUPLICATE_ENTRY = 'ER_DUP_ENTRY';
const REFERENCED_ROW = ['ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'];
const MISSING_REFERENCED_ROW = [
  'ER_NO_REFERENCED_ROW',
  'ER_NO_REFERENCED_ROW_2',
];

@Injectable()
export class TournamentTypeOrmRepository implements TournamentRepository {
  constructor(
    @InjectRepository(Tournament) private readonly orm: Repository<Tournament>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // IMPORTANT: no relations are loaded on purpose. This entity is modified and
  // saved afterwards, and a stale loaded `sport` would win over the `sportId`
  // column and keep the tournament under the old sport.
  findById(id: number): Promise<Tournament | null> {
    return this.orm.findOne({ where: { id } });
  }

  findDetail(id: number): Promise<Tournament | null> {
    return this.orm.findOne({ where: { id }, relations: { sport: true } });
  }

  findAll(filter: TournamentFilter): Promise<Tournament[]> {
    const query = this.orm
      .createQueryBuilder('tournament')
      .innerJoinAndSelect('tournament.sport', 'sport');

    if (filter.active !== undefined) {
      query.andWhere('tournament.active = :active', { active: filter.active });
    }
    if (filter.sportId !== undefined) {
      query.andWhere('tournament.sportId = :sportId', {
        sportId: filter.sportId,
      });
    }
    if (filter.name) {
      query.andWhere('tournament.name LIKE :name', {
        name: `%${filter.name.replace(/[\\%_]/g, '\\$&')}%`,
      });
    }

    return query
      .orderBy('tournament.startDate', 'ASC')
      .addOrderBy('tournament.id', 'ASC')
      .getMany();
  }

  findOpenEnrollment(): Promise<Tournament[]> {
    return this.orm
      .createQueryBuilder('tournament')
      .innerJoinAndSelect('tournament.sport', 'sport')
      .where('tournament.active = true')
      .andWhere('tournament.enrollmentDeadline >= CURDATE()')
      .andWhere('tournament.startDate > CURDATE()')
      .orderBy('tournament.enrollmentDeadline', 'ASC')
      .addOrderBy('tournament.id', 'ASC')
      .getMany();
  }

  async existsByName(
    sportId: number,
    name: string,
    ignoreId?: number,
  ): Promise<boolean> {
    // The column collation makes this comparison case and accent insensitive.
    const query = this.orm
      .createQueryBuilder('tournament')
      .where('tournament.sportId = :sportId', { sportId })
      .andWhere('tournament.name = :name', { name });
    if (ignoreId !== undefined) {
      query.andWhere('tournament.id <> :ignoreId', { ignoreId });
    }
    return (await query.getCount()) > 0;
  }

  async countDependencies(id: number): Promise<TournamentDependencies> {
    const manager = this.dataSource.manager;
    const [phases, matches] = await Promise.all([
      manager.count(Phase, { where: { tournamentId: id } }),
      manager
        .createQueryBuilder(Match, 'match')
        .innerJoin('match.phase', 'phase')
        .where('phase.tournamentId = :id', { id })
        .getCount(),
    ]);
    return { phases, matches };
  }

  async save(tournament: Tournament): Promise<Tournament> {
    try {
      return await this.orm.save(tournament);
    } catch (error) {
      const code = this.driverCode(error);
      if (code === DUPLICATE_ENTRY) throw new DuplicateTournamentNameError();
      if (code && MISSING_REFERENCED_ROW.includes(code)) {
        throw new TournamentSportMissingError();
      }
      throw error;
    }
  }

  async remove(tournament: Tournament): Promise<void> {
    try {
      await this.orm.remove(tournament);
    } catch (error) {
      const code = this.driverCode(error);
      if (code && REFERENCED_ROW.includes(code)) {
        throw new TournamentInUseError();
      }
      throw error;
    }
  }

  private driverCode(error: unknown): string | undefined {
    const candidate = error as {
      code?: string;
      driverError?: { code?: string };
    };
    return candidate?.driverError?.code ?? candidate?.code;
  }
}
