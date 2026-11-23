import { MatchNotificationRecipientsProvider } from '../ports/match-notification-recipients.port';
import { NotificationClient } from '../ports/notification-client.port';
import { SecurityUserClient } from '../ports/security-user-client.port';
import { MatchNotificationsService } from './match-notifications.service';

describe('MatchNotificationsService', () => {
  let service: MatchNotificationsService;
  let client: jest.Mocked<NotificationClient>;
  let recipientsProvider: jest.Mocked<MatchNotificationRecipientsProvider>;
  let securityUserClient: jest.Mocked<SecurityUserClient>;

  beforeEach(() => {
    client = { sendEmail: jest.fn() };
    recipientsProvider = { getMatchRecipientEmails: jest.fn() };
    securityUserClient = {
      findUserNameById: jest.fn(),
      findUserEmailById: jest.fn(),
    };
    service = new MatchNotificationsService(
      client,
      recipientsProvider,
      securityUserClient,
    );
  });

  it('should resolve player name from ms_seguridad and deduplicate recipient emails', async () => {
    recipientsProvider.getMatchRecipientEmails.mockResolvedValue([
      'fan1@correo.com',
      ' FAN1@CORREO.COM ',
      null,
      '   ',
      'fan2@correo.com',
    ]);
    securityUserClient.findUserNameById.mockResolvedValue('Carlos Bacca');
    client.sendEmail.mockResolvedValue();

    await service.notifyScoringEventCreated({
      matchId: 7,
      playerUserId: 50,
      playerDocument: '1053812345',
      teamName: 'Leones FC',
      minute: 42,
      type: 'GOL',
      authorizationHeader: 'Bearer jwt-token',
    });

    expect(securityUserClient.findUserNameById).toHaveBeenCalledWith(
      50,
      'Bearer jwt-token',
    );
    expect(client.sendEmail).toHaveBeenCalledTimes(2);
    const [, subject, html] = client.sendEmail.mock.calls[0];
    expect(subject).toContain('#7');
    expect(html).toContain('GOL');
    expect(html).toContain("42'");
    expect(html).toContain('Leones FC');
    expect(html).toContain('Carlos Bacca');
  });

  it('should fall back to player document when ms_seguridad does not return a name and not throw on email failure', async () => {
    recipientsProvider.getMatchRecipientEmails.mockResolvedValue([
      'fail@correo.com',
      'ok@correo.com',
    ]);
    securityUserClient.findUserNameById.mockResolvedValue(null);
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
            playerUserId: 50,
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
    expect(html).toContain('Doc. 1053812345');
  });
});
