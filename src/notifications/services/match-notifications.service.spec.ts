import { MatchNotificationRecipientsProvider } from '../ports/match-notification-recipients.port';
import { NotificationClient } from '../ports/notification-client.port';
import { MatchNotificationsService } from './match-notifications.service';

describe('MatchNotificationsService', () => {
  let service: MatchNotificationsService;
  let client: jest.Mocked<NotificationClient>;
  let recipientsProvider: jest.Mocked<MatchNotificationRecipientsProvider>;

  beforeEach(() => {
    client = { sendEmail: jest.fn() };
    recipientsProvider = { getMatchRecipientEmails: jest.fn() };
    service = new MatchNotificationsService(client, recipientsProvider);
  });

  it('should deduplicate recipient emails, ignore empty entries and include event details in HTML', async () => {
    recipientsProvider.getMatchRecipientEmails.mockResolvedValue([
      'fan1@correo.com',
      ' FAN1@CORREO.COM ',
      null,
      '   ',
      'fan2@correo.com',
    ]);
    client.sendEmail.mockResolvedValue();

    await service.notifyScoringEventCreated({
      matchId: 7,
      playerDocument: '1053812345',
      teamName: 'Leones FC',
      minute: 42,
      type: 'GOL',
    });

    expect(client.sendEmail).toHaveBeenCalledTimes(2);
    const [, subject, html] = client.sendEmail.mock.calls[0];
    expect(subject).toContain('#7');
    expect(html).toContain('GOL');
    expect(html).toContain("42'");
    expect(html).toContain('Leones FC');
    expect(html).toContain('1053812345');
  });

  it('should not throw if notification client fails for one or all recipients', async () => {
    recipientsProvider.getMatchRecipientEmails.mockResolvedValue([
      'fail@correo.com',
      'ok@correo.com',
    ]);
    client.sendEmail
      .mockRejectedValueOnce(new Error('ms_notificaciones unavailable'))
      .mockResolvedValueOnce();

    await expect(
      service.notifyMatchFinished({
        matchId: 7,
        homeTeamName: 'Leones FC',
        awayTeamName: 'Tigres FC',
        homeScore: 2,
        awayScore: 1,
        scoringEvents: [
          {
            minute: 15,
            type: 'GOL',
            playerDocument: '1053812345',
            teamName: 'Leones FC',
          },
        ],
      }),
    ).resolves.toBeUndefined();

    expect(client.sendEmail).toHaveBeenCalledTimes(2);
    const [, subject, html] = client.sendEmail.mock.calls[0];
    expect(subject).toContain('Leones FC 2 - 1 Tigres FC');
    expect(html).toContain("15'");
  });
});
