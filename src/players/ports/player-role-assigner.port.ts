export const PLAYER_ROLE_ASSIGNER = Symbol('PLAYER_ROLE_ASSIGNER');

export interface PlayerRoleAssigner {
  assignPlayerRole(
    userId: number,
    authorizationHeader?: string,
  ): Promise<void>;
}
