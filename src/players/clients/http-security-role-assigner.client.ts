import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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

  async assignPlayerRole(
    userId: number,
    authorizationHeader?: string,
  ): Promise<void> {
    const auth = authorizationHeader?.trim();
    if (!auth) {
      return;
    }

    const requestConfig = {
      headers: { Authorization: auth },
      timeout: 3000,
    };

    try {
      const rolesResponse = await axios.get<SecurityRoleResponse[]>(
        `${this.baseUrl}/api/roles`,
        requestConfig,
      );
      const roles = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
      const playerRole = roles.find((role) =>
        PLAYER_ROLE_NAMES.has(role.name?.trim().toUpperCase()),
      );

      if (!playerRole) {
        this.logger.warn(
          `No existe el rol JUGADOR/PLAYER en ms_seguridad; no se asignó rol al usuario #${userId}`,
        );
        return;
      }

      await axios.post(
        `${this.baseUrl}/api/user-roles`,
        { userId, roleId: playerRole.id },
        requestConfig,
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
