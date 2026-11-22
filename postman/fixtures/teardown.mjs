// Removes every row created by the automated Postman tests (names starting with "QA-" or
// "QA<digits>"), in foreign key order. Needed because a finished match cannot be deleted
// through the API, so the tests that finish one leave data behind.
// Run from the ms_sports folder:  node postman/fixtures/teardown.mjs
import { connect, TEST_DATA } from './db.mjs';

const c = await connect();
const count = async (sql) => (await c.query(sql))[0].affectedRows;
const ids = (table, where) => `(SELECT id FROM (SELECT id FROM \`${table}\` WHERE ${where}) x)`;

const QA_PLAYER = "document COLLATE utf8mb4_bin REGEXP '^QA(-|[0-9])'";
const sportIds = ids('sports', TEST_DATA);
const teamIds = ids('teams', TEST_DATA);
const playerIds = ids('players', QA_PLAYER);
const tournamentIds = `(SELECT id FROM (SELECT id FROM tournaments WHERE ${TEST_DATA} OR sport_id IN ${sportIds}) x)`;
const phaseIds = ids('phases', `tournament_id IN ${tournamentIds}`);
const matchIds = `(SELECT id FROM (SELECT id FROM matches WHERE phase_id IN ${phaseIds} OR home_team_id IN ${teamIds} OR away_team_id IN ${teamIds}) x)`;

const removed = {
  scoring_events: await count(
    `DELETE FROM scoring_events WHERE match_id IN ${matchIds} OR team_id IN ${teamIds} OR player_id IN ${playerIds}`,
  ),
  matches: await count(`DELETE FROM matches WHERE id IN ${matchIds}`),
  registrations: await count(
    `DELETE FROM registrations WHERE tournament_id IN ${tournamentIds} OR team_id IN ${teamIds}`,
  ),
  phases: await count(`DELETE FROM phases WHERE id IN ${phaseIds}`),
  player_contracts: await count(
    `DELETE FROM player_contracts WHERE team_id IN ${teamIds} OR player_id IN ${playerIds}`,
  ),
  players: await count(`DELETE FROM players WHERE id IN ${playerIds}`),
  team_sports: await count(`DELETE FROM team_sports WHERE sport_id IN ${sportIds} OR team_id IN ${teamIds}`),
  tournaments: await count(`DELETE FROM tournaments WHERE id IN ${tournamentIds}`),
  teams: await count(`DELETE FROM teams WHERE ${TEST_DATA}`),
  sub_sports: await count(`DELETE FROM sports WHERE parent_sport_id IS NOT NULL AND ${TEST_DATA}`),
  sports: await count(`DELETE FROM sports WHERE ${TEST_DATA}`),
};
console.log('Teardown done:', JSON.stringify(removed));
await c.end();
