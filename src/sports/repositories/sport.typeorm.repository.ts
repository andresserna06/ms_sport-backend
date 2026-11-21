import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, SelectQueryBuilder } from 'typeorm';
import { TeamSport } from '../../team-sports/entities/team-sport.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Sport } from '../entities/sport.entity';
import {
  DuplicateSportNameError,
  ParentSportNotFoundError,
  SportDependencies,
  SportFilter,
  SportInUseError,
  SportRepository,
} from './sport.repository';

const DUPLICATE_ENTRY = 'ER_DUP_ENTRY';
const REFERENCED_ROW = ['ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'];
const MISSING_REFERENCED_ROW = ['ER_NO_REFERENCED_ROW', 'ER_NO_REFERENCED_ROW_2'];

@Injectable()
export class SportTypeOrmRepository implements SportRepository {
  constructor(
    @InjectRepository(Sport)
    private readonly orm: Repository<Sport>,
  ) {}

  // IMPORTANT: no relations are loaded on purpose. This entity is modified and
  // saved afterwards, and a stale loaded `parentSport` would win over the
  // `parentSportId` column and move the sport under the wrong parent.
  findById(id: number): Promise<Sport | null> {
    return this.orm.findOne({ where: { id } });
  }

  async findDetail(id: number): Promise<Sport | null> {
    const [sport] = await this.fetchDetails(
      this.detailQuery().where('sport.id = :id', { id }),
    );
    return sport ?? null;
  }

  findAll(filter: SportFilter): Promise<Sport[]> {
    const query = this.detailQuery();

    if (filter.active !== undefined) {
      query.andWhere('sport.active = :active', { active: filter.active });
    }
    if (filter.name) {
      query.andWhere('sport.name LIKE :name', {
        name: `%${filter.name.replace(/[\\%_]/g, '\\$&')}%`,
      });
    }
    if (filter.parentSportId !== undefined) {
      query.andWhere('sport.parentSportId = :parentSportId', {
        parentSportId: filter.parentSportId,
      });
    }

    return this.fetchDetails(query.orderBy('sport.name', 'ASC'));
  }

  findSubSports(parentSportId: number, active?: boolean): Promise<Sport[]> {
    const query = this.detailQuery().where(
      'sport.parentSportId = :parentSportId',
      { parentSportId },
    );

    if (active !== undefined) {
      query.andWhere('sport.active = :active', { active });
    }

    return this.fetchDetails(query.orderBy('sport.name', 'ASC'));
  }

  // The column collation (utf8mb4_unicode_ci) makes the comparison
  // case and accent insensitive.
  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    return this.orm.exists({
      where: excludeId === undefined ? { name } : { name, id: Not(excludeId) },
    });
  }

  async countDependencies(id: number): Promise<SportDependencies> {
    const manager = this.orm.manager;
    const [subSports, activeSubSports, teams, tournaments] = await Promise.all([
      this.orm.count({ where: { parentSportId: id } }),
      this.orm.count({ where: { parentSportId: id, active: true } }),
      manager.count(TeamSport, { where: { sportId: id } }),
      manager.count(Tournament, { where: { sportId: id } }),
    ]);
    return { subSports, activeSubSports, teams, tournaments };
  }

  async save(sport: Sport): Promise<Sport> {
    try {
      return await this.orm.save(sport);
    } catch (error) {
      const code = this.driverCode(error);
      if (code === DUPLICATE_ENTRY) {
        throw new DuplicateSportNameError();
      }
      if (code && MISSING_REFERENCED_ROW.includes(code)) {
        throw new ParentSportNotFoundError();
      }
      throw error;
    }
  }

  async remove(sport: Sport): Promise<void> {
    try {
      await this.orm.remove(sport);
    } catch (error) {
      if (REFERENCED_ROW.includes(this.driverCode(error) ?? '')) {
        throw new SportInUseError();
      }
      throw error;
    }
  }

  // Read model: the sport, its parent (leftJoin on a ManyToOne never
  // duplicates rows) and the number of its sub-sports (correlated subquery).
  private detailQuery() {
    return this.orm
      .createQueryBuilder('sport')
      .leftJoinAndSelect('sport.parentSport', 'parentSport')
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(child.id)')
            .from(Sport, 'child')
            .where('child.parent_sport_id = sport.id'),
        'subSportsCount',
      );
  }

  private async fetchDetails(
    query: SelectQueryBuilder<Sport>,
  ): Promise<Sport[]> {
    const { entities, raw } = await query.getRawAndEntities<{
      sport_id: number;
      subSportsCount: string | number;
    }>();

    const counts = new Map<number, number>();
    for (const row of raw) {
      counts.set(Number(row.sport_id), Number(row.subSportsCount));
    }
    for (const entity of entities) {
      entity.subSportsCount = counts.get(entity.id) ?? 0;
    }
    return entities;
  }

  private driverCode(error: unknown): string | undefined {
    const candidate = error as {
      code?: string;
      driverError?: { code?: string };
    };
    return candidate?.driverError?.code ?? candidate?.code;
  }
}
