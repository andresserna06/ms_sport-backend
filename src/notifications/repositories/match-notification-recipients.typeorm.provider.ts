import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bet } from '../../bets/entities/bet.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { type MatchNotificationRecipientsProvider } from '../ports/match-notification-recipients.port';
import {
  MATCH_PREVIOUS_ATTENDEES_REPOSITORY,
  type MatchPreviousAttendeesRepository,
} from '../ports/match-previous-attendees.repository';
import {
  SECURITY_USER_CLIENT,
  type SecurityUserClient,
} from '../ports/security-user-client.port';

@Injectable()
export class TypeOrmMatchNotificationRecipientsProvider
  implements MatchNotificationRecipientsProvider
{
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Bet)
    private readonly betRepository: Repository<Bet>,
    @Inject(MATCH_PREVIOUS_ATTENDEES_REPOSITORY)
    private readonly previousAttendeesRepository: MatchPreviousAttendeesRepository,
    @Inject(SECURITY_USER_CLIENT)
    private readonly securityUserClient: SecurityUserClient,
    private readonly configService: ConfigService,
  ) {}

  async getMatchRecipientEmails(
    matchId: number,
    authorizationHeader?: string,
  ): Promise<(string | null)[]> {
    const [tickets, bets] = await Promise.all([
      this.ticketRepository.find({
        where: { matchId },
        relations: { fan: true },
      }),
      this.betRepository.find({
        where: { matchId },
        relations: { fan: true },
      }),
    ]);

    const uniqueUserIds = new Set<number>();
    for (const ticket of tickets) {
      if (ticket.fan?.active) {
        uniqueUserIds.add(ticket.fan.userId);
      }
    }
    for (const bet of bets) {
      if (bet.fan?.active) {
        uniqueUserIds.add(bet.fan.userId);
      }
    }

    if (uniqueUserIds.size === 0) {
      const testEmail = this.configService
        .get<string>('NOTIFICATIONS_TEST_EMAIL')
        ?.trim();
      return testEmail ? [testEmail] : [];
    }

    return Promise.all(
      Array.from(uniqueUserIds).map((userId) =>
        this.securityUserClient.findUserEmailById(userId, authorizationHeader),
      ),
    );
  }

  async getPreviousMatchAttendeeEmails(
    matchId: number,
    teamIds: number[],
    authorizationHeader?: string,
  ): Promise<(string | null)[]> {
    const userIds =
      await this.previousAttendeesRepository.findActiveFanUserIdsByPreviousTeamMatches(
        matchId,
        teamIds,
      );

    if (userIds.length === 0) {
      const testEmail = this.configService
        .get<string>('NOTIFICATIONS_TEST_EMAIL')
        ?.trim();
      return testEmail ? [testEmail] : [];
    }

    return Promise.all(
      Array.from(new Set(userIds)).map((userId) =>
        this.securityUserClient.findUserEmailById(userId, authorizationHeader),
      ),
    );
  }
}
