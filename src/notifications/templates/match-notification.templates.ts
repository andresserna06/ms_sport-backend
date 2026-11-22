export interface MatchCreatedNotificationPayload {
  matchId: number;
  phaseId: number;
  homeTeamName?: string;
  awayTeamName?: string;
  scheduledAt: string;
}

export interface ScoringEventNotificationPayload {
  matchId: number;
  playerUserId?: number;
  playerDocument: string;
  teamName: string;
  minute: number;
  type: string;
  authorizationHeader?: string;
}

export interface MatchFinishedNotificationPayload {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  authorizationHeader?: string;
  scoringEvents: {
    minute: number;
    type: string;
    playerUserId?: number;
    playerDocument: string;
    teamName: string;
  }[];
}

export interface ScoringEventEmailData {
  matchId: number;
  playerName: string;
  teamName: string;
  minute: number;
  type: string;
}

export interface MatchFinishedEmailData {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  scoringEvents: {
    minute: number;
    type: string;
    playerName: string;
    teamName: string;
  }[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildScoringEventEmail(data: ScoringEventEmailData): {
  subject: string;
  htmlContent: string;
} {
  const subject = `Nueva anotación en el partido #${data.matchId}`;
  const htmlContent = [
    `<h2>¡Nueva anotación registrada!</h2>`,
    `<p>Se registró una anotación en el <strong>partido #${data.matchId}</strong>:</p>`,
    `<ul>`,
    `<li><strong>Tipo:</strong> ${escapeHtml(data.type)}</li>`,
    `<li><strong>Minuto:</strong> ${data.minute}'</li>`,
    `<li><strong>Equipo:</strong> ${escapeHtml(data.teamName)}</li>`,
    `<li><strong>Jugador:</strong> ${escapeHtml(data.playerName)}</li>`,
    `</ul>`,
  ].join('');

  return { subject, htmlContent };
}

export function buildMatchCreatedEmail(data: MatchCreatedNotificationPayload): {
  subject: string;
  htmlContent: string;
} {
  const home = data.homeTeamName ? escapeHtml(data.homeTeamName) : 'Por definir';
  const away = data.awayTeamName ? escapeHtml(data.awayTeamName) : 'Por definir';
  const subject = `Nuevo partido programado #${data.matchId}`;
  const htmlContent = [
    `<h2>Nuevo partido programado</h2>`,
    `<p>Se ha creado el <strong>partido #${data.matchId}</strong> en la fase #${data.phaseId}.</p>`,
    `<ul>`,
    `<li><strong>Local:</strong> ${home}</li>`,
    `<li><strong>Visitante:</strong> ${away}</li>`,
    `<li><strong>Fecha programada:</strong> ${escapeHtml(data.scheduledAt)}</li>`,
    `</ul>`,
  ].join('');
  return { subject, htmlContent };
}

export function buildMatchFinishedEmail(data: MatchFinishedEmailData): {
  subject: string;
  htmlContent: string;
} {
  const safeHome = escapeHtml(data.homeTeamName);
  const safeAway = escapeHtml(data.awayTeamName);
  const subject = `Resumen final: ${data.homeTeamName} ${data.homeScore} - ${data.awayScore} ${data.awayTeamName}`;
  const eventsHtml =
    data.scoringEvents.length > 0
      ? `<ul>${data.scoringEvents
          .map(
            (e) =>
              `<li><strong>${e.minute}'</strong> – ${escapeHtml(e.type)} (${escapeHtml(e.teamName)}, ${escapeHtml(e.playerName)})</li>`,
          )
          .join('')}</ul>`
      : `<p>No se registraron anotaciones individuales en este encuentro.</p>`;

  const htmlContent = [
    `<h2>Resumen final del partido #${data.matchId}</h2>`,
    `<p><strong>${safeHome} ${data.homeScore} - ${data.awayScore} ${safeAway}</strong></p>`,
    `<h3>Anotaciones</h3>`,
    eventsHtml,
  ].join('');

  return { subject, htmlContent };
}
