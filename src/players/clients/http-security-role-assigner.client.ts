import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ApplicationException } from '../../exception/application.exception';
import { ErrorCase } from '../../exception/error-case.enum';
import { PlayerRoleAssigner } from '../ports/player-role-assigner.port';

interface SecurityRoleResponse {
  id: number;
  name: string;
}

const PLAYER_ROLE_NAMES = new Set([
  'JUGADOR',
  'PLAYER',
  'ROLE_JUGADOR',
  'ROLE_PLAYER',
]);

@Injectable()
export class HttpSecurityRoleAssignerClient implements PlayerRoleAssigner {
  private readonly logger = new Logger(HttpSecurityRoleAssignerClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('MS_SECURITY') ?? 'http://localhost:8181'
    ).replace(/\/+$/, '');
  }

  async resolvePlayerRoleId(
    authorizationHeader?: string,
  ): Promise<number | null> {
    const auth = authorizationHeader?.trim();
    if (!auth) {
      return null;
    }

    let roles: SecurityRoleResponse[];
    try {
      const rolesResponse = await axios.get<SecurityRoleResponse[]>(
        `${this.baseUrl}/api/roles`,
        {
          headers: { Authorization: auth },
          timeout: 3000,
        },
      );
      roles = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
    } catch (error) {
      this.logger.warn(
        `No se pudieron consultar los roles en ms_seguridad: ${String(error)}`,
      );
      return null;
    }

    const playerRole = roles.find((role) =>
      PLAYER_ROLE_NAMES.has(role.name?.trim().toUpperCase()),
    );
    if (!playerRole) {
      throw new ApplicationException(
        ErrorCase.INVALID_STATE,
        'No existe el rol JUGADOR/PLAYER en ms_seguridad. Debes crearlo antes de registrar un jugador',
      );
    }

    return playerRole.id;
  }

  async assignPlayerRole(
    userId: number,
    authorizationHeader?: string,
    roleId?: number | null,
  ): Promise<void> {
    const auth = authorizationHeader?.trim();
    if (!auth) {
      return;
    }

    const resolvedRoleId =
      roleId ?? (await this.resolvePlayerRoleId(authorizationHeader));
    if (resolvedRoleId === null) {
      return;
    }

    try {
      await axios.post(
        `${this.baseUrl}/api/user-roles`,
        { userId, roleId: resolvedRoleId },
        {
          headers: { Authorization: auth },
          timeout: 3000,
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        this.logger.debug(
          `El usuario #${userId} ya tiene asignado el rol de jugador en ms_seguridad`,
        );
        return;
      }

      this.logger.warn(
        `No se pudo asignar el rol de jugador al usuario #${userId} en ms_seguridad: ${String(error)}`,
      );
    }
  }
}
