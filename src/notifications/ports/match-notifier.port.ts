import {
  type MatchFinishedNotificationPayload,
  type ScoringEventNotificationPayload,
} from '../templates/match-notification.templates';

export const MATCH_NOTIFIER = Symbol('MATCH_NOTIFIER');

export interface MatchNotifier {
  notifyScoringEventCreated(
    payload: ScoringEventNotificationPayload,
  ): Promise<void>;
  notifyMatchFinished(
    payload: MatchFinishedNotificationPayload,
  ): Promise<void>;
}
