export const NOTIFICATION_CLIENT = Symbol('NOTIFICATION_CLIENT');

export interface NotificationClient {
  sendEmail(to: string, subject: string, htmlContent: string): Promise<void>;
}
