import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  MATCH_NOTIFICATION_RECIPIENTS_PROVIDER,
  type MatchNotificationRecipientsProvider,
} from '../ports/match-notification-recipients.port';
import { type MatchNotifier } from '../ports/match-notifier.port';
import {
  NOTIFICATION_CLIENT,
  type NotificationClient,
} from '../ports/notification-client.port';
import {
  SECURITY_USER_CLIENT,
  type SecurityUserClient,
} from '../ports/security-user-client.port';
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
    @Inject(SECURITY_USER_CLIENT)
    private readonly securityUserClient: SecurityUserClient,
  ) {}

  async notifyScoringEventCreated(
    payload: ScoringEventNotificationPayload,
  ): Promise<void> {
    const playerName = await this.resolvePlayerDisplayName(
      payload.playerUserId,
      payload.playerDocument,
      payload.authorizationHeader,
    );

    const { subject, htmlContent } = buildScoringEventEmail({
      matchId: payload.matchId,
      playerName,
      teamName: payload.teamName,
      minute: payload.minute,
      type: payload.type,
    });
    await this.dispatchToMatchRecipients(payload.matchId, subject, htmlContent);
  }

  async notifyMatchFinished(
    payload: MatchFinishedNotificationPayload,
  ): Promise<void> {
    const uniqueUserIds = Array.from(
      new Set(
        payload.scoringEvents
          .map((e) => e.playerUserId)
          .filter((id): id is number => id !== undefined),
      ),
    );

    const resolvedEntries = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const name = await this.securityUserClient.findUserNameById(
          userId,
          payload.authorizationHeader,
        );
        return [userId, name] as const;
      }),
    );
    const nameByUserId = new Map<number, string | null>(resolvedEntries);

    const { subject, htmlContent } = buildMatchFinishedEmail({
      matchId: payload.matchId,
      homeTeamName: payload.homeTeamName,
      awayTeamName: payload.awayTeamName,
      homeScore: payload.homeScore,
      awayScore: payload.awayScore,
      scoringEvents: payload.scoringEvents.map((event) => {
        const resolved =
          event.playerUserId !== undefined
            ? nameByUserId.get(event.playerUserId)
            : null;
        return {
          minute: event.minute,
          type: event.type,
          teamName: event.teamName,
          playerName: resolved || `Doc. ${event.playerDocument}`,
        };
      }),
    });
    await this.dispatchToMatchRecipients(payload.matchId, subject, htmlContent);
  }

  private async resolvePlayerDisplayName(
    userId: number | undefined,
    document: string,
    authorizationHeader?: string,
  ): Promise<string> {
    if (userId !== undefined) {
      const name = await this.securityUserClient.findUserNameById(
        userId,
        authorizationHeader,
      );
      if (name) {
        return name;
      }
    }
    return `Doc. ${document}`;
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
