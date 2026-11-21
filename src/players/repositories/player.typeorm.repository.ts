import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';
import {
  PlayerFilterOptions,
  PlayerRepository,
} from './player.repository';

@Injectable()
export class PlayerTypeOrmRepository implements PlayerRepository {
  constructor(
    @InjectRepository(Player)
    private readonly orm: Repository<Player>,
  ) {}

  async findAll(filters: PlayerFilterOptions): Promise<Player[]> {
    const qb = this.orm
      .createQueryBuilder('player')
      .orderBy('player.id', 'ASC');

    if (filters.active !== undefined) {
      qb.andWhere('player.active = :active', { active: filters.active });
    }

    const docFilter = filters.document?.trim();
    if (docFilter) {
      qb.andWhere('LOWER(player.document) LIKE LOWER(:document)', {
        document: `%${docFilter}%`,
      });
    }

    const posFilter = filters.position?.trim();
    if (posFilter) {
      qb.andWhere('LOWER(player.position) LIKE LOWER(:position)', {
        position: `%${posFilter}%`,
      });
    }

    return qb.getMany();
  }

  async findById(id: number): Promise<Player | null> {
    return this.orm.findOne({ where: { id } });
  }

  async existsByDocument(
    document: string,
    excludeId?: number,
  ): Promise<boolean> {
    const qb = this.orm
      .createQueryBuilder('player')
      .where('LOWER(TRIM(player.document)) = LOWER(TRIM(:document))', {
        document,
      });

    if (excludeId !== undefined) {
      qb.andWhere('player.id != :excludeId', { excludeId });
    }

    return (await qb.getCount()) > 0;
  }

  async existsByUserId(userId: number, excludeId?: number): Promise<boolean> {
    const qb = this.orm
      .createQueryBuilder('player')
      .where('player.userId = :userId', { userId });

    if (excludeId !== undefined) {
      qb.andWhere('player.id != :excludeId', { excludeId });
    }

    return (await qb.getCount()) > 0;
  }

  async save(player: Player): Promise<Player> {
    return this.orm.save(player);
  }

  async remove(player: Player): Promise<void> {
    await this.orm.remove(player);
  }
}
