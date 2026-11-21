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

const created = { sports: 0, teams: 0, teamSports: 0, tournaments: 0 };

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
await tournament('Copa Colombia de Fútbol 2027', '2027-03-06', '2027-02-20', football);
await tournament('Liga Profesional de Fútbol 2027', '2027-02-05', '2027-01-20', football);
await tournament('Liga Nacional de Baloncesto 2027', '2027-04-10', '2027-03-25', basketball);
await tournament('Copa de Baloncesto 2027', '2027-06-12', '2027-05-28', basketball);
await tournament('Torneo Relámpago de Baloncesto 2027', '2027-08-14', '2027-08-01', basketball);
await tournament('Campeonato Nacional de Atletismo 2027', '2027-05-08', '2027-04-22', athletics);
await tournament('Gran Premio de Atletismo 2027', '2027-07-17', '2027-07-01', athletics);
await tournament('Copa Ciudad de Atletismo 2027', '2027-09-04', '2027-08-18', athletics);

console.log('Seed finished. New rows:', JSON.stringify(created));
await db.end();
