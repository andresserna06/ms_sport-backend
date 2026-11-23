import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const MATCH_NOTIFICATION_RECIPIENTS_PROVIDER = Symbol(
  'MATCH_NOTIFICATION_RECIPIENTS_PROVIDER',
);

export interface MatchNotificationRecipientsProvider {
  getMatchRecipientEmails(
    matchId: number,
    authorizationHeader?: string,
  ): Promise<(string | null)[]>;
}

@Injectable()
export class EnvMatchNotificationRecipientsProvider
  implements MatchNotificationRecipientsProvider
{
  constructor(private readonly configService: ConfigService) {}

  async getMatchRecipientEmails(
    _matchId: number,
    _authorizationHeader?: string,
  ): Promise<(string | null)[]> {
    const testEmail = this.configService
      .get<string>('NOTIFICATIONS_TEST_EMAIL')
      ?.trim();
    return testEmail ? [testEmail] : [];
  }
}
