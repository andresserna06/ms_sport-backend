import { Player } from '../entities/player.entity';

export const PLAYER_REPOSITORY = Symbol('PLAYER_REPOSITORY');

export interface PlayerFilterOptions {
  active?: boolean;
  document?: string;
  position?: string;
}

export interface PlayerRepository {
  findAll(filters: PlayerFilterOptions): Promise<Player[]>;
  findById(id: number): Promise<Player | null>;
  existsByDocument(document: string, excludeId?: number): Promise<boolean>;
  existsByUserId(userId: number, excludeId?: number): Promise<boolean>;
  save(player: Player): Promise<Player>;
  remove(player: Player): Promise<void>;
}
