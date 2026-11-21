// Creates the dependencies HU-GD-01 cannot create through the API yet
// (team_sports and tournaments, owned by HU-GD-03 / HU-GC-01).
// Run from the ms_sports folder:  node postman/fixtures/seed.mjs
import { connect } from './db.mjs';

const c = await connect();
const [[existing]] = await c.query("SELECT COUNT(*) n FROM sports WHERE name LIKE 'QA-FIX-%'");
if (existing.n > 0) {
  console.error('Fixtures already exist. Run teardown.mjs first.');
  await c.end();
  process.exit(1);
}

const sport = async (name, parentId = null) => {
  const [r] = await c.query('INSERT INTO sports (name, active, parent_sport_id) VALUES (?, 1, ?)', [name, parentId]);
  return r.insertId;
};
const teamSport = (teamId, sportId) => c.query('INSERT INTO team_sports (team_id, sport_id) VALUES (?, ?)', [teamId, sportId]);
const tournament = (name, sportId) =>
  c.query('INSERT INTO tournaments (name, start_date, enrollment_deadline, sport_id) VALUES (?, ?, ?, ?)', [name, '2027-03-01', '2027-02-01', sportId]);

const [team] = await c.query("INSERT INTO teams (name, city, contact_email, active) VALUES ('QA-FIX-TEAM', 'Test City', 'qa-fix@example.com', 1)");

const withTeam = await sport('QA-FIX-EQUIPO');
await teamSport(team.insertId, withTeam);

const withTournaments = await sport('QA-FIX-TORNEO');
for (let i = 1; i <= 3; i++) await tournament(`QA-FIX-TOURNAMENT-A${i}`, withTournaments);

const mixed = await sport('QA-FIX-MIXTO');
await sport('QA-FIX-MIXTO sub 1', mixed);
await sport('QA-FIX-MIXTO sub 2', mixed);
await teamSport(team.insertId, mixed);
for (let i = 1; i <= 3; i++) await tournament(`QA-FIX-TOURNAMENT-B${i}`, mixed);

console.log('Fixtures created: QA-FIX-EQUIPO, QA-FIX-TORNEO, QA-FIX-MIXTO (+2 sub-sports).');
await c.end();
