import { Inject, Injectable, Logger } from '@nestjs/common';
import { type MatchNotifier } from '../ports/match-notifier.port';
import {
  MATCH_NOTIFICATION_RECIPIENTS_PROVIDER,
  type MatchNotificationRecipientsProvider,
} from '../ports/match-notification-recipients.port';
import {
  NOTIFICATION_CLIENT,
  type NotificationClient,
} from '../ports/notification-client.port';
import {
  buildMatchFinishedEmail,
  buildScoringEventEmail,
  type MatchFinishedNotificationPayload,
  type ScoringEventNotificationPayload,
} from '../templates/match-notification.templates';

@Injectable()
export class MatchNotificationsService implements MatchNotifier {
  private readonly logger = new Logger(MatchNotificationsService.name);

  constructor(
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationClient: NotificationClient,
    @Inject(MATCH_NOTIFICATION_RECIPIENTS_PROVIDER)
    private readonly recipientsProvider: MatchNotificationRecipientsProvider,
  ) {}

  async notifyScoringEventCreated(
    payload: ScoringEventNotificationPayload,
  ): Promise<void> {
    const { subject, htmlContent } = buildScoringEventEmail(payload);
    await this.dispatchToMatchRecipients(payload.matchId, subject, htmlContent);
  }

  async notifyMatchFinished(
    payload: MatchFinishedNotificationPayload,
  ): Promise<void> {
    const { subject, htmlContent } = buildMatchFinishedEmail(payload);
    await this.dispatchToMatchRecipients(payload.matchId, subject, htmlContent);
  }

  private async dispatchToMatchRecipients(
    matchId: number,
    subject: string,
    htmlContent: string,
  ): Promise<void> {
    let rawEmails: (string | null)[];
    try {
      rawEmails =
        await this.recipientsProvider.getMatchRecipientEmails(matchId);
    } catch (error) {
      this.logger.warn(
        `No se pudieron resolver destinatarios para partido #${matchId}: ${String(error)}`,
      );
      return;
    }

    const uniqueEmails = new Set<string>();
    for (const raw of rawEmails) {
      const normalized = raw?.trim().toLowerCase();
      if (!normalized) {
        this.logger.warn(
          `Destinatario sin correo registrado omitido en partido #${matchId}`,
        );
        continue;
      }
      uniqueEmails.add(normalized);
    }

    if (uniqueEmails.size === 0) {
      return;
    }

    const recipients = Array.from(uniqueEmails);
    const results = await Promise.allSettled(
      recipients.map((email) =>
        this.notificationClient.sendEmail(email, subject, htmlContent),
      ),
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.warn(
          `Error enviando notificación a ${recipients[index]} (partido #${matchId}): ${String(result.reason)}`,
        );
      }
    });
  }
}
