import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FanRoleAssigner } from '../ports/fan-role-assigner.port';

interface SecurityRoleResponse {
  id: number;
  name: string;
}

const FAN_ROLE_NAMES = new Set([
  'FAN',
  'AFICIONADO',
  'ROLE_FAN',
  'ROLE_AFICIONADO',
]);

@Injectable()
export class HttpSecurityFanRoleAssignerClient implements FanRoleAssigner {
  private readonly logger = new Logger(HttpSecurityFanRoleAssignerClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('MS_SECURITY') ?? 'http://localhost:8181'
    ).replace(/\/+$/, '');
  }

  async assignFanRole(
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
      const fanRole = roles.find((role) =>
        FAN_ROLE_NAMES.has(role.name?.trim().toUpperCase()),
      );

      if (!fanRole) {
        this.logger.warn(
          `No existe el rol FAN/AFICIONADO en ms_seguridad; no se asignó rol al usuario #${userId}`,
        );
        return;
      }

      await axios.post(
        `${this.baseUrl}/api/user-roles`,
        { userId, roleId: fanRole.id },
        requestConfig,
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        this.logger.debug(
          `El usuario #${userId} ya tiene asignado el rol de aficionado en ms_seguridad`,
        );
        return;
      }

      this.logger.warn(
        `No se pudo asignar el rol de aficionado al usuario #${userId} en ms_seguridad: ${String(error)}`,
      );
    }
  }
}
