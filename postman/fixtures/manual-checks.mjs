// HU-GD-01 manual checks M-01..M-03 (outside Newman). Run from the ms_sports folder:
//   node postman/fixtures/manual-checks.mjs
// Creates rows named "QA<runId> ..." that teardown.mjs removes.
import { connect } from './db.mjs';

const base = process.env.BASE_URL ?? 'http://localhost:3001';
const runId = Date.now();
const results = [];
const check = (id, label, ok, detail) => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${label}${detail ? ' -> ' + detail : ''}`);
};
const api = async (method, path, body) => {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { code: r.status, json: text ? JSON.parse(text) : null };
};
const c = await connect();
const row = async (id) => (await c.query('SELECT id, name, description, active, parent_sport_id FROM sports WHERE id = ?', [id]))[0][0];

// M-01: what the API writes is really stored in MySQL
{
  const created = (await api('POST', '/sports', { name: `QA${runId} M01 Fútbol`, description: 'desc original' })).json;
  let r = await row(created.id);
  check('M-01', 'POST stored in MySQL', r && r.name === created.name && r.description === 'desc original' && r.active === 1 && r.parent_sport_id === null, JSON.stringify(r));
  const upd = (await api('PUT', `/sports/${created.id}`, { name: `QA${runId} M01 Futsal`, description: 'desc nueva' })).json;
  r = await row(created.id);
  check('M-01', 'PUT stored in MySQL', r && r.name === upd.name && r.description === 'desc nueva', JSON.stringify(r));
  const sub = (await api('POST', '/sports', { name: `QA${runId} M01 Sub`, parentSportId: created.id })).json;
  r = await row(sub.id);
  check('M-01', 'sub-sport parent_sport_id stored', r && r.parent_sport_id === created.id, JSON.stringify(r));
  const del = await api('DELETE', `/sports/${sub.id}`);
  check('M-01', 'DELETE removed the row from MySQL', del.code === 204 && (await row(sub.id)) === undefined, `status ${del.code}`);
  await api('PATCH', `/sports/${created.id}/deactivate`);
  r = await row(created.id);
  check('M-01', 'PATCH deactivate stored in MySQL', r && r.active === 0, JSON.stringify(r));
}

// M-02: two simultaneous POSTs with the same name
{
  const name = `QA${runId} M02 Concurrent`;
  const rs = await Promise.all([api('POST', '/sports', { name }), api('POST', '/sports', { name })]);
  const codes = rs.map((r) => r.code).sort();
  const [rows] = await c.query('SELECT COUNT(*) n FROM sports WHERE name = ?', [name]);
  const loser = rs.find((r) => r.code !== 201);
  check('M-02', 'one 201 and one 409 ALREADY_EXISTS, never 500, single row',
    codes.join() === '201,409' && loser.json.errorCase === 'ALREADY_EXISTS' && rows[0].n === 1,
    `codes=${codes} errorCase=${loser?.json?.errorCase} rows=${rows[0].n}`);
}

// M-03: the RESTRICT foreign key is the real safety net (direct SQL, bypassing the API)
{
  const parent = (await api('POST', '/sports', { name: `QA${runId} M03 Parent` })).json;
  await api('POST', '/sports', { name: `QA${runId} M03 Child`, parentSportId: parent.id });
  let errno = null;
  try { await c.query('DELETE FROM sports WHERE id = ?', [parent.id]); } catch (e) { errno = e.errno; }
  check('M-03', 'DELETE with a child is rejected by the FK (errno 1451) and the row survives', errno === 1451 && !!(await row(parent.id)), `errno=${errno}`);
}

await c.end();
const failed = results.filter((ok) => !ok).length;
console.log(`Manual checks: ${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
