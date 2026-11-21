import { Module } from '@nestjs/common';
import { HttpNotificationClient } from './clients/http-notification.client';
import {
  EnvMatchNotificationRecipientsProvider,
  MATCH_NOTIFICATION_RECIPIENTS_PROVIDER,
} from './ports/match-notification-recipients.port';
import { MATCH_NOTIFIER } from './ports/match-notifier.port';
import { NOTIFICATION_CLIENT } from './ports/notification-client.port';
import { MatchNotificationsService } from './services/match-notifications.service';

@Module({
  providers: [
    MatchNotificationsService,
    {
      provide: MATCH_NOTIFIER,
      useExisting: MatchNotificationsService,
    },
    {
      provide: NOTIFICATION_CLIENT,
      useClass: HttpNotificationClient,
    },
    {
      provide: MATCH_NOTIFICATION_RECIPIENTS_PROVIDER,
      useClass: EnvMatchNotificationRecipientsProvider,
    },
  ],
  exports: [MatchNotificationsService, MATCH_NOTIFIER],
})
export class NotificationsModule {}
