export const PLAYER_ROLE_ASSIGNER = Symbol('PLAYER_ROLE_ASSIGNER');

export interface PlayerRoleAssigner {
  resolvePlayerRoleId(authorizationHeader?: string): Promise<number | null>;
  assignPlayerRole(
    userId: number,
    authorizationHeader?: string,
    roleId?: number | null,
  ): Promise<void>;
}
