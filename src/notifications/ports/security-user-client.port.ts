export const SECURITY_USER_CLIENT = Symbol('SECURITY_USER_CLIENT');

export interface SecurityUserClient {
  findUserNameById(
    userId: number,
    authorizationHeader?: string,
  ): Promise<string | null>;
  findUserEmailById(
    userId: number,
    authorizationHeader?: string,
  ): Promise<string | null>;
}
