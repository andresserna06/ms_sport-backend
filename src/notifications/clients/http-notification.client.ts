import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationClient } from '../ports/notification-client.port';

@Injectable()
export class HttpNotificationClient implements NotificationClient {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('NOTIFICATIONS_SERVICE_URL') ??
      'http://localhost:8000'
    ).replace(/\/+$/, '');
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
  ): Promise<void> {
    await axios.post(
      `${this.baseUrl}/send-email`,
      {
        to,
        subject,
        html_content: htmlContent,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      },
    );
  }
}
