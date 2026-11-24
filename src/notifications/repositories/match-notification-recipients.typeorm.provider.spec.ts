import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Bet } from '../../bets/entities/bet.entity';
import { Fan } from '../../fans/entities/fan.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { MatchPreviousAttendeesRepository } from '../ports/match-previous-attendees.repository';
import { SecurityUserClient } from '../ports/security-user-client.port';
import { TypeOrmMatchNotificationRecipientsProvider } from './match-notification-recipients.typeorm.provider';

describe('TypeOrmMatchNotificationRecipientsProvider', () => {
  let provider: TypeOrmMatchNotificationRecipientsProvider;
  let ticketRepo: jest.Mocked<Pick<Repository<Ticket>, 'find'>>;
  let betRepo: jest.Mocked<Pick<Repository<Bet>, 'find'>>;
  let previousAttendeesRepository: jest.Mocked<MatchPreviousAttendeesRepository>;
  let securityUserClient: jest.Mocked<SecurityUserClient>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

  beforeEach(() => {
    ticketRepo = { find: jest.fn() };
    betRepo = { find: jest.fn() };
    previousAttendeesRepository = {
      findActiveFanUserIdsByPreviousTeamMatches: jest.fn(),
    };
    securityUserClient = {
      findUserNameById: jest.fn(),
      findUserEmailById: jest.fn(),
    };
    configService = { get: jest.fn() };

    provider = new TypeOrmMatchNotificationRecipientsProvider(
      ticketRepo as unknown as Repository<Ticket>,
      betRepo as unknown as Repository<Bet>,
      previousAttendeesRepository,
      securityUserClient,
      configService as unknown as ConfigService,
    );
  });

  it('resolves unique emails from ms_seguridad for active fans with tickets or bets', async () => {
    const fan1 = Object.assign(new Fan(), { id: 1, userId: 10, active: true });
    const fan2 = Object.assign(new Fan(), { id: 2, userId: 20, active: true });
    const inactiveFan = Object.assign(new Fan(), {
      id: 3,
      userId: 30,
      active: false,
    });

    ticketRepo.find.mockResolvedValue([
      Object.assign(new Ticket(), { id: 1, matchId: 5, fan: fan1 }),
      Object.assign(new Ticket(), { id: 2, matchId: 5, fan: inactiveFan }),
    ]);
    betRepo.find.mockResolvedValue([
      Object.assign(new Bet(), { id: 1, matchId: 5, fan: fan1 }),
      Object.assign(new Bet(), { id: 2, matchId: 5, fan: fan2 }),
    ]);

    securityUserClient.findUserEmailById
      .mockResolvedValueOnce('fan1@correo.com')
      .mockResolvedValueOnce('fan2@correo.com');

    const emails = await provider.getMatchRecipientEmails(5, 'Bearer token');

    expect(securityUserClient.findUserEmailById).toHaveBeenCalledTimes(2);
    expect(securityUserClient.findUserEmailById).toHaveBeenCalledWith(
      10,
      'Bearer token',
    );
    expect(securityUserClient.findUserEmailById).toHaveBeenCalledWith(
      20,
      'Bearer token',
    );
    expect(emails).toEqual(['fan1@correo.com', 'fan2@correo.com']);
  });

  it('falls back to NOTIFICATIONS_TEST_EMAIL when match has no tickets or bets', async () => {
    ticketRepo.find.mockResolvedValue([]);
    betRepo.find.mockResolvedValue([]);
    configService.get.mockReturnValue('demo@correo.com');

    const emails = await provider.getMatchRecipientEmails(9);

    expect(securityUserClient.findUserEmailById).not.toHaveBeenCalled();
    expect(emails).toEqual(['demo@correo.com']);
  });

  it('resolves previous match attendee emails from tickets only', async () => {
    previousAttendeesRepository.findActiveFanUserIdsByPreviousTeamMatches.mockResolvedValue([
      10,
      20,
      10,
    ]);
    securityUserClient.findUserEmailById
      .mockResolvedValueOnce('fan1@correo.com')
      .mockResolvedValueOnce('fan2@correo.com');

    const emails = await provider.getPreviousMatchAttendeeEmails(9, [1, 2], 'Bearer token');

    expect(
      previousAttendeesRepository.findActiveFanUserIdsByPreviousTeamMatches,
    ).toHaveBeenCalledWith(9, [1, 2]);
    expect(securityUserClient.findUserEmailById).toHaveBeenCalledTimes(2);
    expect(securityUserClient.findUserEmailById).toHaveBeenNthCalledWith(1, 10, 'Bearer token');
    expect(securityUserClient.findUserEmailById).toHaveBeenNthCalledWith(2, 20, 'Bearer token');
    expect(emails).toEqual(['fan1@correo.com', 'fan2@correo.com']);
  });

  it('falls back to NOTIFICATIONS_TEST_EMAIL when no previous attendees exist', async () => {
    previousAttendeesRepository.findActiveFanUserIdsByPreviousTeamMatches.mockResolvedValue([]);
    configService.get.mockReturnValue('demo@correo.com');

    const emails = await provider.getPreviousMatchAttendeeEmails(9, [1, 2]);

    expect(securityUserClient.findUserEmailById).not.toHaveBeenCalled();
    expect(emails).toEqual(['demo@correo.com']);
  });
});
