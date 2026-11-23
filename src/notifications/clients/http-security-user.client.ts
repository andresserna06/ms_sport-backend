import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SecurityUserClient } from '../ports/security-user-client.port';

interface SecurityUserResponse {
  name?: string;
  email?: string;
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
    const user = await this.fetchUser(userId, authorizationHeader);
    const name = user?.name?.trim();
    return name || null;
  }

  async findUserEmailById(
    userId: number,
    authorizationHeader?: string,
  ): Promise<string | null> {
    const user = await this.fetchUser(userId, authorizationHeader);
    const email = user?.email?.trim();
    return email || null;
  }

  private async fetchUser(
    userId: number,
    authorizationHeader?: string,
  ): Promise<SecurityUserResponse | null> {
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
      return response.data ?? null;
    } catch (error) {
      this.logger.debug(
        `No se pudo obtener el usuario #${userId} desde ms_seguridad: ${String(error)}`,
      );
      return null;
    }
  }
}
