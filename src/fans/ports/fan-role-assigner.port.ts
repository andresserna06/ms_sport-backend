export const FAN_ROLE_ASSIGNER = Symbol('FAN_ROLE_ASSIGNER');

export interface FanRoleAssigner {
  assignFanRole(
    userId: number,
    authorizationHeader?: string,
  ): Promise<void>;
}
