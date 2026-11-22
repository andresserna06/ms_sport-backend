// Loads realistic sample data (sports, sub-sports, teams, team-sport links and
// tournaments) into the development database. Safe to run many times: each
// record is inserted only when its name does not exist yet.
//
// Run from the ms_sports folder:  npm run seed
// Development database only: refuses to run unless DB_NAME is "sports_db".
import mysql from 'mysql2/promise';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

if (process.env.DB_NAME !== 'sports_db') {
  console.error(
    `Refusing to run: DB_NAME is "${process.env.DB_NAME}", expected "sports_db".`,
  );
  process.exit(1);
}

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const created = {
  sports: 0,
  teams: 0,
  teamSports: 0,
  tournaments: 0,
  phases: 0,
  matches: 0,
  players: 0,
  scoringEvents: 0,
};

// Returns the id of the row with that name, inserting it first when missing.
async function ensure(table, counter, name, columns) {
  const [rows] = await db.query(`SELECT id FROM \`${table}\` WHERE name = ?`, [name]);
  if (rows.length > 0) return rows[0].id;
  const entries = Object.entries({ name, ...columns });
  const [result] = await db.query(
    `INSERT INTO \`${table}\` (${entries.map(([k]) => `\`${k}\``).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`,
    entries.map(([, v]) => v),
  );
  created[counter] += 1;
  return result.insertId;
}

const sport = (name, description, parentId = null, active = 1) =>
  ensure('sports', 'sports', name, { description, active, parent_sport_id: parentId });

const team = (name, city, email, foundedYear, active = 1) =>
  ensure('teams', 'teams', name, {
    city,
    contact_email: email,
    founded_year: foundedYear,
    active,
  });

const tournament = (name, startDate, deadline, sportId) =>
  ensure('tournaments', 'tournaments', name, {
    start_date: startDate,
    enrollment_deadline: deadline,
    sport_id: sportId,
  });

async function link(teamId, sportId) {
  const [rows] = await db.query(
    'SELECT id FROM team_sports WHERE team_id = ? AND sport_id = ?',
    [teamId, sportId],
  );
  if (rows.length > 0) return;
  await db.query('INSERT INTO team_sports (team_id, sport_id) VALUES (?, ?)', [teamId, sportId]);
  created.teamSports += 1;
}

// ---- Sports and sub-sports -------------------------------------------------
const football = await sport('Fútbol', 'Deporte de equipo con balón jugado con los pies');
const football11 = await sport('Fútbol 11', 'Modalidad tradicional en cancha completa', football);
await sport('Fútbol sala', 'Modalidad en cancha cubierta de cinco jugadores', football);
await sport('Fútbol playa', 'Modalidad sobre arena', football);

const basketball = await sport('Baloncesto', 'Deporte de equipo con balón y aro');
await sport('Baloncesto 5x5', 'Modalidad tradicional de cinco jugadores por equipo', basketball);
await sport('Baloncesto 3x3', 'Modalidad callejera en media cancha', basketball);

const volleyball = await sport('Voleibol', 'Deporte de equipo con red central');
await sport('Voleibol de cancha', 'Seis jugadores por equipo en cancha cubierta', volleyball);
await sport('Voleibol de playa', 'Dos jugadores por equipo sobre arena', volleyball);

const tennis = await sport('Tenis', 'Deporte de raqueta, individual o por parejas');
const swimming = await sport('Natación', 'Deporte acuático de velocidad y resistencia');
const athletics = await sport('Atletismo', 'Pruebas de pista, campo y ruta');
await sport('Squash', 'Deporte de raqueta en cancha cerrada', null, 0); // inactive

// ---- Teams -----------------------------------------------------------------
const nacional = await team('Atlético Nacional', 'Medellín', 'contacto@atlnacional.com.co', 1947);
const millonarios = await team('Millonarios', 'Bogotá', 'contacto@millonarios.com.co', 1946);
const america = await team('América de Cali', 'Cali', 'contacto@americadecali.co', 1927);
const deportivoCali = await team('Deportivo Cali', 'Cali', 'contacto@deportivocali.co', 1912);
const junior = await team('Junior de Barranquilla', 'Barranquilla', 'contacto@juniorfc.co', 1924);
const santaFe = await team('Independiente Santa Fe', 'Bogotá', 'contacto@independientesantafe.co', 1941);
const onceCaldas = await team('Once Caldas', 'Manizales', 'contacto@oncecaldas.com.co', 1961);
const piratas = await team('Piratas de Bogotá', 'Bogotá', 'contacto@piratasbogota.co', 2010);
const campestre = await team('Club Campestre de Medellín', 'Medellín', 'contacto@campestremedellin.co', 1924);
await team('Cúcuta Deportivo', 'Cúcuta', 'contacto@cucutadeportivo.co', 1924, 0); // inactive

// ---- Teams and the sports they play ---------------------------------------
for (const id of [nacional, millonarios, america, deportivoCali, junior, santaFe, onceCaldas]) {
  await link(id, football);
}
await link(nacional, football11);
await link(piratas, basketball);
await link(campestre, tennis);
await link(campestre, swimming);

// ---- Tournaments -----------------------------------------------------------
const copaColombia = await tournament(
  'Copa Colombia de Fútbol 2027',
  '2027-03-06',
  '2027-02-20',
  football,
);
await tournament('Liga Profesional de Fútbol 2027', '2027-02-05', '2027-01-20', football);
await tournament('Liga Nacional de Baloncesto 2027', '2027-04-10', '2027-03-25', basketball);
await tournament('Copa de Baloncesto 2027', '2027-06-12', '2027-05-28', basketball);
await tournament('Torneo Relámpago de Baloncesto 2027', '2027-08-14', '2027-08-01', basketball);
await tournament('Campeonato Nacional de Atletismo 2027', '2027-05-08', '2027-04-22', athletics);
await tournament('Gran Premio de Atletismo 2027', '2027-07-17', '2027-07-01', athletics);
await tournament('Copa Ciudad de Atletismo 2027', '2027-09-04', '2027-08-18', athletics);

// ---- Competition of the Copa Colombia (phases, matches, goals) -------------
// Sample data for the tournament overview (HU-GC-08). The other tournaments
// are left without phases on purpose, to show the empty case.
async function insertOnce(table, counter, where, params, columns) {
  const [rows] = await db.query(
    `SELECT id FROM \`${table}\` WHERE ${where}`,
    params,
  );
  if (rows.length > 0) return rows[0].id;
  const entries = Object.entries(columns);
  const [result] = await db.query(
    `INSERT INTO \`${table}\` (${entries.map(([k]) => `\`${k}\``).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`,
    entries.map(([, v]) => v),
  );
  created[counter] += 1;
  return result.insertId;
}

const phase = (name, order, type) =>
  insertOnce('phases', 'phases', 'name = ? AND tournament_id = ?', [name, copaColombia], {
    name,
    phase_order: order,
    phase_type: type,
    tournament_id: copaColombia,
  });

const match = (phaseId, scheduledAt, status, home, away, homeScore, awayScore) =>
  insertOnce(
    'matches',
    'matches',
    'phase_id = ? AND scheduled_at = ?',
    [phaseId, scheduledAt],
    {
      scheduled_at: scheduledAt,
      status,
      home_score: homeScore,
      away_score: awayScore,
      home_team_id: home,
      away_team_id: away,
      phase_id: phaseId,
    },
  );

const player = (userId, document, position, jerseyNumber) =>
  insertOnce('players', 'players', 'document = ?', [document], {
    user_id: userId,
    document,
    position,
    jersey_number: jerseyNumber,
    active: 1,
  });

const goal = (matchId, playerId, teamId, minute) =>
  insertOnce(
    'scoring_events',
    'scoringEvents',
    'match_id = ? AND player_id = ? AND minute = ?',
    [matchId, playerId, minute],
    { match_id: matchId, player_id: playerId, team_id: teamId, minute, type: 'GOAL' },
  );

const groupPhase = await phase('Fase de grupos', 1, 'GROUP');
const finalPhase = await phase('Final', 2, 'FINAL');

const played1 = await match(groupPhase, '2027-03-06 15:00:00', 'FINISHED', nacional, millonarios, 2, 1);
await match(groupPhase, '2027-03-06 17:30:00', 'FINISHED', america, deportivoCali, 0, 0);
await match(groupPhase, '2027-03-13 15:00:00', 'SCHEDULED', junior, santaFe, null, null);
await match(finalPhase, '2027-04-03 16:00:00', 'SCHEDULED', null, null, null, null);

const strikerNacional = await player(900001, 'SEED-1001', 'Delantero', 9);
const midfielderNacional = await player(900002, 'SEED-1002', 'Mediocampista', 10);
const strikerMillonarios = await player(900003, 'SEED-2001', 'Delantero', 11);
await goal(played1, strikerNacional, nacional, 12);
await goal(played1, strikerMillonarios, millonarios, 40);
await goal(played1, midfielderNacional, nacional, 78);

console.log('Seed finished. New rows:', JSON.stringify(created));
await db.end();
