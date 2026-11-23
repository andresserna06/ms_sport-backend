import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bet } from '../bets/entities/bet.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { HttpNotificationClient } from './clients/http-notification.client';
import { HttpSecurityUserClient } from './clients/http-security-user.client';
import { MATCH_NOTIFICATION_RECIPIENTS_PROVIDER } from './ports/match-notification-recipients.port';
import { MATCH_NOTIFIER } from './ports/match-notifier.port';
import { NOTIFICATION_CLIENT } from './ports/notification-client.port';
import { SECURITY_USER_CLIENT } from './ports/security-user-client.port';
import { TypeOrmMatchNotificationRecipientsProvider } from './repositories/match-notification-recipients.typeorm.provider';
import { MatchNotificationsService } from './services/match-notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Bet])],
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
      useClass: TypeOrmMatchNotificationRecipientsProvider,
    },
    {
      provide: SECURITY_USER_CLIENT,
      useClass: HttpSecurityUserClient,
    },
  ],
  exports: [MatchNotificationsService, MATCH_NOTIFIER],
})
export class NotificationsModule {}
