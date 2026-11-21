import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SecurityUserClient } from '../ports/security-user-client.port';

interface SecurityUserResponse {
  name?: string;
}

@Injectable()
export class HttpSecurityUserClient implements SecurityUserClient {
  private readonly logger = new Logger(HttpSecurityUserClient.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('MS_SECURITY') ?? 'http://localhost:8181'
    ).replace(/\/+$/, '');
  }

  async findUserNameById(
    userId: number,
    authorizationHeader?: string,
  ): Promise<string | null> {
    try {
      const response = await axios.get<SecurityUserResponse>(
        `${this.baseUrl}/api/users/${userId}`,
        {
          headers: authorizationHeader
            ? { Authorization: authorizationHeader }
            : undefined,
          timeout: 3000,
        },
      );
      const name = response.data?.name?.trim();
      return name || null;
    } catch (error) {
      this.logger.debug(
        `No se pudo obtener el nombre del usuario #${userId} desde ms_seguridad: ${String(error)}`,
      );
      return null;
    }
  }
}
