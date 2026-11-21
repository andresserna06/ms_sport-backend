// Removes every row created by the HU-GD-01 tests (names starting with "QA-" or "QA<digits>"),
// in FK order. Run from the ms_sports folder:  node postman/fixtures/teardown.mjs
import { connect, TEST_DATA } from './db.mjs';

const c = await connect();
const count = async (sql) => (await c.query(sql))[0].affectedRows;
const sportIds = "(SELECT id FROM (SELECT id FROM sports WHERE " + TEST_DATA + ") s)";
const teamIds = "(SELECT id FROM (SELECT id FROM teams WHERE " + TEST_DATA + ") t)";

const removed = {
  team_sports: await count(`DELETE FROM team_sports WHERE sport_id IN ${sportIds} OR team_id IN ${teamIds}`),
  tournaments: await count(`DELETE FROM tournaments WHERE ${TEST_DATA} OR sport_id IN ${sportIds}`),
  teams: await count(`DELETE FROM teams WHERE ${TEST_DATA}`),
  sub_sports: await count(`DELETE FROM sports WHERE parent_sport_id IS NOT NULL AND ${TEST_DATA}`),
  sports: await count(`DELETE FROM sports WHERE ${TEST_DATA}`),
};
console.log('Teardown done:', JSON.stringify(removed));
await c.end();
