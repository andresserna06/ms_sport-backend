export const FAN_ROLE_ASSIGNER = Symbol('FAN_ROLE_ASSIGNER');

export interface FanRoleAssigner {
  resolveFanRoleId(authorizationHeader?: string): Promise<number | null>;
  assignFanRole(
    userId: number,
    authorizationHeader?: string,
    roleId?: number | null,
  ): Promise<void>;
}
