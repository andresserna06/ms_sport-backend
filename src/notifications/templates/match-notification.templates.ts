export interface ScoringEventNotificationPayload {
  matchId: number;
  playerDocument: string;
  teamName: string;
  minute: number;
  type: string;
}

export interface MatchFinishedNotificationPayload {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  scoringEvents: {
    minute: number;
    type: string;
    playerDocument: string;
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

export function buildScoringEventEmail(
  payload: ScoringEventNotificationPayload,
): { subject: string; htmlContent: string } {
  const subject = `Nueva anotación en el partido #${payload.matchId}`;
  const htmlContent = [
    `<h2>¡Nueva anotación registrada!</h2>`,
    `<p>Se registró una anotación en el <strong>partido #${payload.matchId}</strong>:</p>`,
    `<ul>`,
    `<li><strong>Tipo:</strong> ${escapeHtml(payload.type)}</li>`,
    `<li><strong>Minuto:</strong> ${payload.minute}'</li>`,
    `<li><strong>Equipo:</strong> ${escapeHtml(payload.teamName)}</li>`,
    `<li><strong>Jugador (doc):</strong> ${escapeHtml(payload.playerDocument)}</li>`,
    `</ul>`,
  ].join('');

  return { subject, htmlContent };
}

export function buildMatchFinishedEmail(
  payload: MatchFinishedNotificationPayload,
): { subject: string; htmlContent: string } {
  const safeHome = escapeHtml(payload.homeTeamName);
  const safeAway = escapeHtml(payload.awayTeamName);
  const subject = `Resumen final: ${payload.homeTeamName} ${payload.homeScore} - ${payload.awayScore} ${payload.awayTeamName}`;
  const eventsHtml =
    payload.scoringEvents.length > 0
      ? `<ul>${payload.scoringEvents
          .map(
            (e) =>
              `<li><strong>${e.minute}'</strong> – ${escapeHtml(e.type)} (${escapeHtml(e.teamName)}, jugador doc. ${escapeHtml(e.playerDocument)})</li>`,
          )
          .join('')}</ul>`
      : `<p>No se registraron anotaciones individuales en este encuentro.</p>`;

  const htmlContent = [
    `<h2>Resumen final del partido #${payload.matchId}</h2>`,
    `<p><strong>${safeHome} ${payload.homeScore} - ${payload.awayScore} ${safeAway}</strong></p>`,
    `<h3>Anotaciones</h3>`,
    eventsHtml,
  ].join('');

  return { subject, htmlContent };
}
