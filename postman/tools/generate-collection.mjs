// Generator of postman/MsSports.postman_collection.json (HU-GD-01). Usage (from ms_sports): node postman/tools/generate-collection.mjs postman/MsSports.postman_collection.json
// Case functions are embedded as source text into the Postman scripts, so they are never executed here.
import { writeFileSync } from 'node:fs';

const OUT = process.argv[2];

// ---------- prelude embedded in every script ----------
function prelude() {
  const base = pm.variables.get('baseUrl');
  const runId = pm.collectionVariables.get('runId');
  const N = (x) => `QA${runId} ${x}`;
  const enc = encodeURIComponent;
  const padTo = (s, n) => (s + ' ' + 'x'.repeat(n)).slice(0, n);
  // The sandbox only waits for pm.sendRequest callbacks, not for promise microtasks, so the
  // asynchronous steps are written as generators driven from inside each callback.
  const runIt = (it) => (cb) => {
    const next = (err, val) => {
      let r;
      try { r = err ? it.throw(err) : it.next(val); } catch (e) { return cb(e); }
      if (r.done) return cb(null, r.value);
      if (typeof r.value === 'function') r.value(next); else next(null, r.value);
    };
    next();
  };
  const cr = (fn, ...a) => {
    const r = fn(...a);
    return (r && typeof r.next === 'function' && typeof r.throw === 'function') ? runIt(r) : (cb) => cb(null, r);
  };
  const call = (method, path, body, headers) => (cb) => {
    const opts = { url: base + path, method, header: Object.assign({ 'Content-Type': 'application/json' }, headers || {}) };
    if (body !== undefined) opts.body = { mode: 'raw', raw: typeof body === 'string' ? body : JSON.stringify(body) };
    pm.sendRequest(opts, (err, r) => {
      if (err) return cb(err);
      let json = null;
      try { json = r.json(); } catch (e) { /* not JSON */ }
      cb(null, { code: r.code, text: r.text(), json });
    });
  };
  const track = (s) => {
    const l = JSON.parse(pm.collectionVariables.get('created') || '[]');
    if (!l.some((e) => e.id === s.id)) l.push({ id: s.id, parent: s.parentSportId == null ? null : s.parentSportId });
    pm.collectionVariables.set('created', JSON.stringify(l));
  };
  const mk = (name, extra) => runIt((function* () {
    const r = yield call('POST', '/sports', Object.assign({ name }, extra || {}));
    if (r.code !== 201) throw new Error(`setup POST ${name} -> ${r.code} ${r.text}`);
    track(r.json);
    return r.json;
  })());
  const step = (label, p, expected) => runIt((function* () {
    const r = yield p;
    if (r.code !== expected) throw new Error(`setup ${label} -> ${r.code} (expected ${expected}) ${r.text}`);
    return r.json;
  })());
  const get = (id) => call('GET', '/sports/' + id);
  const put = (id, body) => call('PUT', '/sports/' + id, body);
  const deact = (id) => step('deactivate ' + id, call('PATCH', `/sports/${id}/deactivate`), 200);
  const act = (id) => step('activate ' + id, call('PATCH', `/sports/${id}/activate`), 200);
  const del = (id) => call('DELETE', '/sports/' + id);
  const mkInactive = (name, extra) => runIt((function* () { const s = yield mk(name, extra); yield deact(s.id); return s; })());
  const folderData = (k) => JSON.parse(pm.collectionVariables.get(k) || 'null');
  const fixture = (name) => runIt((function* () {
    const r = yield call('GET', `/sports?all=true&name=${enc(name)}`);
    const f = (r.json || []).find((s) => s.name === name);
    if (!f) throw new Error(`fixture ${name} not found: run "npm run seed" first`);
    return f;
  })());
  // ----- assertions -----
  const resp = () => { try { return pm.response.json(); } catch (e) { return null; } };
  const code = (c) => pm.test(`status is ${c}`, () => pm.expect(pm.response.code).to.eql(c));
  const bizErr = (c, ec, frag) => {
    code(c);
    pm.test(`errorCase is ${ec} with a Spanish message`, () => {
      const j = resp();
      pm.expect(j).to.be.an('object');
      pm.expect(Object.keys(j).sort()).to.eql(['errorCase', 'message']);
      pm.expect(j.errorCase).to.eql(ec);
      pm.expect(j.message).to.be.a('string').and.not.empty;
      [].concat(frag || []).forEach((f) => pm.expect(j.message).to.include(f));
    });
  };
  const valErr = (...keys) => {
    code(400);
    pm.test(`flat validation object with keys ${keys.join(',')}`, () => {
      const j = resp();
      pm.expect(j).to.be.an('object');
      pm.expect(j).to.not.have.property('errorCase');
      keys.forEach((k) => { pm.expect(j).to.have.property(k); pm.expect(j[k]).to.be.a('string').and.not.empty; });
    });
  };
  const shape = (j) => pm.test('response has the SportResponseDto shape', () => {
    pm.expect(j.id).to.be.a('number');
    pm.expect(j.name).to.be.a('string');
    pm.expect(j.description === null || typeof j.description === 'string').to.eql(true);
    pm.expect(j.active).to.be.a('boolean');
    pm.expect(j.parentSportId === null || typeof j.parentSportId === 'number').to.eql(true);
    pm.expect(j.parentSport === null || (typeof j.parentSport.id === 'number' && typeof j.parentSport.name === 'string')).to.eql(true);
  });
  const LQ = () => `/sports?name=${enc(N('LST'))}`;
  const ids = (arr) => arr.map((s) => s.id);
  const same = (a, b, what) => pm.test(what, () => pm.expect(a).to.eql(b));
  const rereadEquals = (j) => runIt((function* () { const g = yield get(j.id); same(g.json, j, 'GET after write returns the same stored state'); })());
  const emptyBody = () => pm.test('response has no body', () => pm.expect(pm.response.text()).to.eql(''));
}
const PRELUDE = (() => { const s = prelude.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); })();

// ---------- case builders ----------
const cases = []; // {folder, id, method, setup, path, body, headers, test}
const folders = [];
let current;
const folder = (name) => { current = { name, items: [] }; folders.push(current); };
const add = (id, method, o) => current.items.push({ id, method, ...o });
const none = () => ({});

// =========================================================================
folder('GD-01 / C Registrar (POST /sports)');
add('C-01', 'POST', { title: 'Registrar raiz con nombre y descripcion', setup: none, path: () => '/sports',
  body: () => ({ name: N('C01 Baloncesto'), description: 'Deporte de equipo' }),
  test: async () => {
    code(201); const j = resp(); shape(j);
    pm.test('created root sport', () => { pm.expect(j.id).to.be.above(0); pm.expect(j.name).to.eql(N('C01 Baloncesto')); pm.expect(j.description).to.eql('Deporte de equipo'); pm.expect(j.active).to.eql(true); pm.expect(j.parentSportId).to.eql(null); pm.expect(j.parentSport).to.eql(null); pm.expect(j.subSportsCount).to.eql(0); });
    await rereadEquals(j);
  } });
add('C-02', 'POST', { title: 'Registrar solo con name', setup: none, path: () => '/sports', body: () => ({ name: N('C02 Ajedrez') }),
  test: async () => { code(201); const j = resp(); pm.test('description null, active true', () => { pm.expect(j.description).to.eql(null); pm.expect(j.active).to.eql(true); }); } });
add('C-03', 'POST', { title: 'Registrar subdeporte bajo una raiz', setup: async () => ({ R: await mk(N('C03 Raiz')) }), path: () => '/sports',
  body: (X) => ({ name: N('C03 Futbol de salon'), parentSportId: X.R.id }),
  test: async (X) => {
    code(201); const j = resp(); shape(j);
    pm.test('parent summarized', () => { pm.expect(j.parentSportId).to.eql(X.R.id); pm.expect(j.parentSport).to.eql({ id: X.R.id, name: X.R.name }); });
    const g = await get(X.R.id); pm.test('parent subSportsCount is 1', () => pm.expect(g.json.subSportsCount).to.eql(1));
  } });
add('C-04', 'POST', { title: 'Trim del nombre con acentos (UTF-8)', setup: none, path: () => '/sports',
  body: () => `{"name":"  QA${runId} C04 Fútbol de salón ñandú  "}`,
  test: async () => {
    code(201); const j = resp();
    pm.test('name trimmed and accents intact', () => pm.expect(j.name).to.eql(`QA${runId} C04 Fútbol de salón ñandú`));
    const g = await get(j.id); pm.test('GET returns the same text', () => pm.expect(g.json.name).to.eql(j.name));
  } });
add('C-05', 'POST', { title: 'Nombre de exactamente 120 caracteres', setup: none, path: () => '/sports', body: () => ({ name: padTo(N('C05'), 120) }),
  test: () => { code(201); pm.test('name length is 120', () => pm.expect(resp().name.length).to.eql(120)); } });
add('C-06', 'POST', { title: '120 caracteres rodeados de espacios', setup: none, path: () => '/sports', body: () => ({ name: '  ' + padTo(N('C06'), 120) + '  ' }),
  test: () => { code(201); pm.test('trimmed to 120', () => { const n = resp().name; pm.expect(n.length).to.eql(120); pm.expect(n).to.eql(n.trim()); }); } });
add('C-07', 'POST', { title: 'Descripcion de exactamente 500 caracteres', setup: none, path: () => '/sports', body: () => ({ name: N('C07'), description: 'd'.repeat(500) }),
  test: () => { code(201); pm.test('description length is 500', () => pm.expect(resp().description.length).to.eql(500)); } });
add('C-08', 'POST', { title: 'Descripcion con espacios alrededor (D4)', setup: none, path: () => '/sports', body: () => ({ name: N('C08 Natacion'), description: '  Texto  ' }),
  test: () => { code(201); pm.test('description trimmed', () => pm.expect(resp().description).to.eql('Texto')); } });
add('C-09', 'POST', { title: 'Descripcion vacia o solo espacios (D4)', setup: none, path: () => '/sports', body: () => ({ name: N('C09 Tenis'), description: '   ' }),
  test: () => { code(201); pm.test('description null', () => pm.expect(resp().description).to.eql(null)); } });
add('C-10', 'POST', { title: 'parentSportId null explicito crea raiz', setup: none, path: () => '/sports', body: () => ({ name: N('C10 Golf'), parentSportId: null }),
  test: () => { code(201); const j = resp(); pm.test('root', () => { pm.expect(j.parentSportId).to.eql(null); pm.expect(j.parentSport).to.eql(null); }); } });
add('C-11', 'POST', { title: 'Nombre con emoji (utf8mb4)', setup: none, path: () => '/sports', body: () => `{"name":"QA${runId} C11 ⚽ Fútbol"}`,
  test: async () => { code(201); const j = resp(); pm.test('name identical', () => pm.expect(j.name).to.eql(`QA${runId} C11 ⚽ Fútbol`)); const g = await get(j.id); same(g.json.name, j.name, 'GET returns the same emoji name'); } });
add('C-12', 'POST', { title: 'Texto con comillas y SQL se guarda literal', setup: none, path: () => '/sports', body: () => ({ name: N("C12 x'; DROP TABLE sports;--") }),
  test: async () => { code(201); const j = resp(); pm.test('literal name', () => pm.expect(j.name).to.eql(N("C12 x'; DROP TABLE sports;--"))); const l = await call('GET', '/sports?all=true'); pm.test('table still exists (GET /sports 200)', () => pm.expect(l.code).to.eql(200)); } });
add('C-13', 'POST', { title: 'Cuerpo vacio {}', setup: none, path: () => '/sports', body: () => ({}), test: () => valErr('name') });
add('C-14', 'POST', { title: 'name cadena vacia', setup: none, path: () => '/sports', body: () => ({ name: '' }), test: () => valErr('name') });
add('C-15', 'POST', { title: 'name solo espacios', setup: none, path: () => '/sports', body: () => ({ name: '     ' }),
  test: async () => { valErr('name'); const l = await call('GET', '/sports?all=true&name=' + enc('     ')); pm.test('nothing created with blank name', () => pm.expect((l.json || []).filter((s) => s.name.trim() === '')).to.eql([])); } });
add('C-16', 'POST', { title: 'name null', setup: none, path: () => '/sports', body: () => ({ name: null }), test: () => valErr('name') });
add('C-17', 'POST', { title: 'name no es texto', setup: none, path: () => '/sports', body: () => ({ name: 123 }), test: () => valErr('name') });
add('C-18', 'POST', { title: 'name de 121 caracteres', setup: none, path: () => '/sports', body: () => ({ name: padTo(N('C18'), 121) }), test: () => valErr('name') });
add('C-19', 'POST', { title: 'description de 501 caracteres', setup: none, path: () => '/sports', body: () => ({ name: N('C19 Rugby'), description: 'd'.repeat(501) }),
  test: async () => { valErr('description'); const l = await call('GET', '/sports?all=true&name=' + enc(N('C19'))); pm.test('not created', () => pm.expect(l.json).to.eql([])); } });
add('C-20', 'POST', { title: 'description no es texto', setup: none, path: () => '/sports', body: () => ({ name: N('C20 Rugby'), description: 123 }), test: () => valErr('description') });
add('C-21', 'POST', { title: 'parentSportId no numerico', setup: none, path: () => '/sports', body: () => ({ name: N('C21 Polo'), parentSportId: 'abc' }), test: () => valErr('parentSportId') });
add('C-22', 'POST', { title: 'parentSportId decimal', setup: none, path: () => '/sports', body: () => ({ name: N('C22 Polo'), parentSportId: 1.5 }), test: () => valErr('parentSportId') });
add('C-23', 'POST', { title: 'parentSportId cero', setup: none, path: () => '/sports', body: () => ({ name: N('C23 Polo'), parentSportId: 0 }), test: () => valErr('parentSportId') });
add('C-24', 'POST', { title: 'parentSportId negativo', setup: none, path: () => '/sports', body: () => ({ name: N('C24 Polo'), parentSportId: -1 }), test: () => valErr('parentSportId') });
add('C-25', 'POST', { title: 'Varios errores a la vez', setup: none, path: () => '/sports', body: () => ({ name: '', description: 'd'.repeat(501), parentSportId: 'x' }), test: () => valErr('name', 'description', 'parentSportId') });
add('C-26', 'POST', { title: 'Padre inexistente', setup: none, path: () => '/sports', body: () => ({ name: N('C26 Hockey'), parentSportId: 2147483647 }), test: () => bizErr(404, 'NOT_FOUND', '2147483647') });
add('C-27', 'POST', { title: 'Campo no permitido active', setup: none, path: () => '/sports', body: () => ({ name: N('C27 Pesas'), active: false }),
  test: async () => { valErr('active'); const l = await call('GET', '/sports?all=true&name=' + enc(N('C27'))); pm.test('not created', () => pm.expect(l.json).to.eql([])); } });
add('C-28', 'POST', { title: 'Campo no permitido id', setup: none, path: () => '/sports', body: () => ({ name: N('C28 Pesas'), id: 99 }), test: () => valErr('id') });
add('C-29', 'POST', { title: 'JSON malformado', setup: none, path: () => '/sports', body: () => '{"name":',
  test: () => { code(400); pm.test('never 500 and error body is JSON', () => pm.expect(resp()).to.be.an('object')); } });
add('C-30', 'POST', { title: 'Nombre duplicado exacto', setup: async () => ({ R: await mk(N('C30 Dup')) }), path: () => '/sports', body: (X) => ({ name: X.R.name }),
  test: (X) => bizErr(409, 'ALREADY_EXISTS', ['Ya existe un deporte con el nombre', X.R.name]) });
add('C-31', 'POST', { title: 'Duplicado con distinta capitalizacion', setup: async () => ({ R: await mk(N('C31 Voleibol')) }), path: () => '/sports', body: () => ({ name: `qa${runId} c31 VOLEIBOL` }),
  test: () => bizErr(409, 'ALREADY_EXISTS') });
add('C-32', 'POST', { title: 'Duplicado sin distinguir acentos', setup: async () => ({ R: await mk(`QA${runId} C32 Fútbol`) }), path: () => '/sports', body: () => `{"name":"qa${runId} C32 FUTBOL"}`,
  test: () => bizErr(409, 'ALREADY_EXISTS') });
add('C-33', 'POST', { title: 'Duplicado tras trim', setup: async () => ({ R: await mk(N('C33 Dup')) }), path: () => '/sports', body: (X) => ({ name: `   ${X.R.name}   ` }),
  test: () => bizErr(409, 'ALREADY_EXISTS') });
add('C-34', 'POST', { title: 'Unicidad global: mismo nombre bajo otro padre', setup: async () => { const R = await mk(N('C34 Dup')); const O = await mk(N('C34 Otra')); return { R, O }; },
  path: () => '/sports', body: (X) => ({ name: X.R.name, parentSportId: X.O.id }), test: () => bizErr(409, 'ALREADY_EXISTS') });
add('C-35', 'GET', { title: 'Un rechazo por duplicado no deja filas',
  setup: async () => { const R = await mk(N('C35 Dup')); const r = await call('POST', '/sports', { name: R.name }); if (r.code !== 409) throw new Error('duplicate POST expected 409, got ' + r.code); return { R }; },
  path: (X) => `/sports?all=true&name=${enc(X.R.name)}`, test: () => { code(200); pm.test('exactly 1 row', () => pm.expect(resp()).to.have.lengthOf(1)); } });
add('C-36', 'POST', { title: 'Padre inactivo', setup: async () => ({ Ri: await mkInactive(N('C36 Inactivo')) }), path: () => '/sports', body: (X) => ({ name: N('C36 Hijo de inactivo'), parentSportId: X.Ri.id }),
  test: async () => { bizErr(409, 'INVALID_STATE'); const l = await call('GET', '/sports?all=true&name=' + enc(N('C36 Hijo'))); pm.test('not created', () => pm.expect(l.json).to.eql([])); } });
add('C-37', 'POST', { title: 'Padre que ya es subdeporte (segundo nivel)', setup: async () => { const R = await mk(N('C37 Raiz')); const H = await mk(N('C37 Hijo'), { parentSportId: R.id }); return { R, H }; },
  path: () => '/sports', body: (X) => ({ name: N('C37 Nieto'), parentSportId: X.H.id }), test: (X) => bizErr(400, 'INVALID_OPERATION', X.H.name) });

// =========================================================================
folder('GD-01 / L Listado (GET /sports)');
add('L-00', 'GET', { setupRequest: true, title: 'Setup: crea La, Lb, Lh, Li', setup: async () => {
    const La = await mk(N('LST Atletismo')); const Lb = await mk(N('LST Boxeo')); const Lh = await mk(N('LST Atletismo pista'), { parentSportId: La.id }); const Li = await mkInactive(N('LST Inactivo'));
    pm.collectionVariables.set('F_L', JSON.stringify({ La, Lb, Lh, Li })); return {};
  }, path: () => '/sports?all=true&name=' + enc(N('LST')), test: () => code(200) });
add('L-01', 'GET', { title: 'Por defecto solo activos', setup: () => folderData('F_L'), path: () => LQ(), test: (X) => {
  code(200); const j = resp(); const i = ids(j);
  pm.test('contains active sports, not the inactive one', () => { [X.La, X.Lb, X.Lh].forEach((s) => pm.expect(i).to.include(s.id)); pm.expect(i).to.not.include(X.Li.id); });
  pm.test('every item active and with the list fields', () => j.forEach((s) => { pm.expect(s.active).to.eql(true); ['id', 'name', 'description', 'parentSportId', 'parentSport'].forEach((k) => pm.expect(s).to.have.property(k)); }));
} });
add('L-02', 'GET', { title: 'active=false devuelve solo inactivos', setup: () => folderData('F_L'), path: () => LQ() + '&active=false', test: (X) => {
  code(200); const j = resp(); pm.test('contains Li and only inactive', () => { pm.expect(ids(j)).to.include(X.Li.id); j.forEach((s) => pm.expect(s.active).to.eql(false)); }); } });
add('L-03', 'GET', { title: 'all=true devuelve todos', setup: () => folderData('F_L'), path: () => LQ() + '&all=true', test: (X) => {
  code(200); pm.test('contains the four sports', () => [X.La, X.Lb, X.Lh, X.Li].forEach((s) => pm.expect(ids(resp())).to.include(s.id))); } });
add('L-04', 'GET', { title: 'active=true explicito', setup: () => folderData('F_L'), path: () => LQ() + '&active=true', test: (X) => {
  code(200); pm.test('active ones only', () => { const j = resp(); [X.La, X.Lb, X.Lh].forEach((s) => pm.expect(ids(j)).to.include(s.id)); pm.expect(ids(j)).to.not.include(X.Li.id); }); } });
add('L-05', 'GET', { title: 'Filtro name parcial sin distinguir mayusculas', setup: () => folderData('F_L'), path: () => `/sports?name=${enc(runId + ' lst atletis')}`, test: (X) => {
  code(200); pm.test('contains La (case-insensitive partial match)', () => pm.expect(ids(resp())).to.include(X.La.id)); } });
add('L-06', 'GET', { title: 'Filtro parentSportId devuelve hijos directos', setup: () => folderData('F_L'), path: (X) => `/sports?parentSportId=${X.La.id}`, test: (X) => {
  code(200); const j = resp(); pm.test('only Lh', () => { pm.expect(ids(j)).to.eql([X.Lh.id]); j.forEach((s) => pm.expect(s.parentSportId).to.eql(X.La.id)); }); } });
add('L-07', 'GET', { title: 'name + parentSportId + all combinados', setup: () => folderData('F_L'), path: (X) => `/sports?name=${enc(N('LST'))}&parentSportId=${X.La.id}&all=true`, test: (X) => {
  code(200); pm.test('only children of La', () => pm.expect(ids(resp())).to.eql([X.Lh.id])); } });
add('L-08', 'GET', { title: 'Sin coincidencias', setup: none, path: () => `/sports?name=${enc('zzz-no-existe-' + runId)}`, test: () => { code(200); pm.test('empty array', () => pm.expect(resp()).to.eql([])); } });
add('L-09', 'GET', { title: 'parentSportId valido sin hijos', setup: () => folderData('F_L'), path: (X) => `/sports?parentSportId=${X.Lb.id}`, test: () => { code(200); pm.test('empty array', () => pm.expect(resp()).to.eql([])); } });
add('L-10', 'GET', { title: 'Comillas en el filtro (no 500)', setup: none, path: () => `/sports?name=${enc('a\'b";--')}`, test: () => { code(200); pm.test('array', () => pm.expect(resp()).to.be.an('array')); } });
add('L-11', 'GET', { title: 'all=true junto con active=false: gana all (D8)', setup: () => folderData('F_L'), path: () => LQ() + '&all=true&active=false', test: (X) => {
  code(200); pm.test('returns all four', () => [X.La, X.Lb, X.Lh, X.Li].forEach((s) => pm.expect(ids(resp())).to.include(s.id))); } });
add('L-12', 'GET', { title: 'name solo espacios (D8)', setup: () => folderData('F_L'), path: () => `/sports?name=${enc('   ')}`, test: (X) => {
  code(200); pm.test('filter ignored: active sports, no inactive', () => { const j = resp(); pm.expect(j).to.be.an('array'); j.forEach((s) => pm.expect(s.active).to.eql(true)); pm.expect(ids(j)).to.not.include(X.Li.id); }); } });
add('L-13', 'GET', { title: 'name con comodin % literal (D8)', setup: () => folderData('F_L'), path: () => `/sports?all=true&name=${enc('%')}`, test: (X) => {
  code(200); pm.test('% is literal text, does not match everything', () => { const j = resp(); pm.expect(j).to.be.an('array'); pm.expect(ids(j)).to.not.include(X.La.id); }); } });
add('L-14', 'GET', { title: 'active no booleano', setup: none, path: () => '/sports?active=maybe', test: () => valErr('active') });
add('L-15', 'GET', { title: 'all no booleano', setup: none, path: () => '/sports?all=xyz', test: () => valErr('all') });
add('L-16', 'GET', { title: 'parentSportId no numerico', setup: none, path: () => '/sports?parentSportId=abc', test: () => valErr('parentSportId') });
add('L-17', 'GET', { title: 'parentSportId cero', setup: none, path: () => '/sports?parentSportId=0', test: () => valErr('parentSportId') });
add('L-18', 'GET', { title: 'Parametro desconocido', setup: none, path: () => '/sports?foo=1', test: () => valErr('foo') });
add('L-19', 'GET', { title: 'Valor repetido', setup: none, path: () => '/sports?name=a&name=b', test: () => valErr('name') });
add('L-20', 'GET', { title: 'name de 121 caracteres', setup: none, path: () => '/sports?name=' + 'x'.repeat(121), test: () => valErr('name') });

// =========================================================================
folder('GD-01 / G Detalle (GET /sports/:id)');
add('G-00', 'GET', { setupRequest: true, title: 'Setup: R con 2 subdeportes y Ri', setup: async () => {
    const R = await mk(N('GET Raiz')); const H1 = await mk(N('GET Hijo 1'), { parentSportId: R.id }); const H2 = await mk(N('GET Hijo 2'), { parentSportId: R.id }); const Ri = await mkInactive(N('GET Inactivo'));
    pm.collectionVariables.set('F_G', JSON.stringify({ R, H1, H2, Ri })); return {};
  }, path: () => '/sports?all=true&name=' + enc(N('GET')), test: () => code(200) });
add('G-01', 'GET', { title: 'Detalle de raiz con 2 subdeportes', setup: () => folderData('F_G'), path: (X) => '/sports/' + X.R.id, test: (X) => {
  code(200); const j = resp(); shape(j); pm.test('root with subSportsCount 2', () => { pm.expect(j.id).to.eql(X.R.id); pm.expect(j.parentSport).to.eql(null); pm.expect(j.subSportsCount).to.eql(2); }); } });
add('G-02', 'GET', { title: 'Detalle de subdeporte', setup: () => folderData('F_G'), path: (X) => '/sports/' + X.H1.id, test: (X) => {
  code(200); const j = resp(); pm.test('parent summarized', () => { pm.expect(j.parentSportId).to.eql(X.R.id); pm.expect(j.parentSport).to.eql({ id: X.R.id, name: X.R.name }); pm.expect(j.subSportsCount).to.eql(0); }); } });
add('G-03', 'GET', { title: 'Detalle de deporte inactivo', setup: () => folderData('F_G'), path: (X) => '/sports/' + X.Ri.id, test: () => { code(200); pm.test('active false', () => pm.expect(resp().active).to.eql(false)); } });
add('G-04', 'GET', { title: 'Id inexistente', setup: none, path: () => '/sports/2147483647', test: () => { bizErr(404, 'NOT_FOUND'); pm.test('exact message', () => pm.expect(resp().message).to.eql('No existe el deporte con id 2147483647')); } });
const badId = (id, v, title, ec, status, exact) => add(id, 'GET', { title, setup: none, path: `() => ${JSON.stringify('/sports/' + v)}`, test: `() => { bizErr(${status}, ${JSON.stringify(ec)}); ${exact ? `pm.test('exact message', () => pm.expect(resp().message).to.eql(${JSON.stringify(exact)}));` : ''} }` });
badId('G-05', 'abc', 'Id no numerico', 'INVALID_OPERATION', 400, 'El id debe ser un número entero');
badId('G-06', '12abc', 'Id mezcla numero y texto', 'INVALID_OPERATION', 400);
badId('G-07', '1.5', 'Id decimal', 'INVALID_OPERATION', 400);
badId('G-08', '1e2', 'Id en notacion exponencial (D2 corregido)', 'INVALID_OPERATION', 400);
badId('G-09', '-1', 'Id negativo', 'NOT_FOUND', 404);
badId('G-10', '0', 'Id cero', 'NOT_FOUND', 404);
badId('G-11', '99999999999', 'Id fuera del rango INT', 'NOT_FOUND', 404);
badId('G-12', '0x10', 'Id hexadecimal (D2 corregido)', 'INVALID_OPERATION', 400);

// =========================================================================
folder('GD-01 / B Subdeportes (GET /sports/:id/subsports)');
add('B-00', 'GET', { setupRequest: true, title: 'Setup: R con H activo y Hi inactivo, R2 con hijo, Rx sin hijos', setup: async () => {
    const R = await mk(N('SUB Raiz')); const H = await mk(N('SUB Hijo activo'), { parentSportId: R.id }); const Hi = await mk(N('SUB Hijo inactivo'), { parentSportId: R.id }); await deact(Hi.id);
    const R2 = await mk(N('SUB Otra raiz')); const H2 = await mk(N('SUB Hijo de otra'), { parentSportId: R2.id }); const Rx = await mk(N('SUB Sin hijos'));
    pm.collectionVariables.set('F_B', JSON.stringify({ R, H, Hi, R2, H2, Rx })); return {};
  }, path: () => '/sports?all=true&name=' + enc(N('SUB')), test: () => code(200) });
add('B-01', 'GET', { title: 'Por defecto solo subdeportes activos (D1 corregido)', setup: () => folderData('F_B'), path: (X) => `/sports/${X.R.id}/subsports`, test: (X) => {
  code(200); const j = resp(); pm.test('only H, active, children of R', () => { pm.expect(ids(j)).to.eql([X.H.id]); j.forEach((s) => { pm.expect(s.parentSportId).to.eql(X.R.id); pm.expect(s.active).to.eql(true); }); }); } });
add('B-02', 'GET', { title: 'all=true devuelve activos e inactivos', setup: () => folderData('F_B'), path: (X) => `/sports/${X.R.id}/subsports?all=true`, test: (X) => {
  code(200); pm.test('H and Hi', () => pm.expect(ids(resp()).sort()).to.eql([X.H.id, X.Hi.id].sort())); } });
add('B-03', 'GET', { title: 'active=false devuelve solo el inactivo (D1 corregido)', setup: () => folderData('F_B'), path: (X) => `/sports/${X.R.id}/subsports?active=false`, test: (X) => {
  code(200); pm.test('only Hi', () => pm.expect(ids(resp())).to.eql([X.Hi.id])); } });
add('B-04', 'GET', { title: 'Raiz sin hijos', setup: () => folderData('F_B'), path: (X) => `/sports/${X.Rx.id}/subsports`, test: () => { code(200); pm.test('empty array', () => pm.expect(resp()).to.eql([])); } });
add('B-05', 'GET', { title: 'Deporte padre inexistente', setup: none, path: () => '/sports/2147483647/subsports', test: () => bizErr(404, 'NOT_FOUND') });
add('B-06', 'GET', { title: 'Id no numerico', setup: none, path: () => '/sports/abc/subsports', test: () => bizErr(400, 'INVALID_OPERATION') });
add('B-07', 'GET', { title: 'active no booleano (D1 corregido)', setup: () => folderData('F_B'), path: (X) => `/sports/${X.R.id}/subsports?active=x`, test: () => valErr('active') });
add('B-08', 'GET', { title: 'Parametro desconocido (D1 corregido)', setup: () => folderData('F_B'), path: (X) => `/sports/${X.R.id}/subsports?foo=1`, test: () => valErr('foo') });

// =========================================================================
folder('GD-01 / U Actualizar (PUT /sports/:id)');
const putCase = (id, title, setup, body, test, idv) => add(id, 'PUT', { title, setup, path: `(X) => '/sports/' + ${idv ? JSON.stringify(idv) : 'X.R.id'}`, body, test });
putCase('U-01', 'Actualizar nombre y descripcion', async () => ({ R: await mk(N('U01 Original'), { description: 'Vieja' }) }), () => ({ name: N('U01 Renombrado'), description: 'Nueva' }),
  async (X) => { code(200); const j = resp(); shape(j); pm.test('new values', () => { pm.expect(j.name).to.eql(N('U01 Renombrado')); pm.expect(j.description).to.eql('Nueva'); pm.expect(j.id).to.eql(X.R.id); }); await rereadEquals(j); });
putCase('U-02', 'Mismo nombre, cambia descripcion', async () => ({ R: await mk(N('U02 Mismo')) }), (X) => ({ name: X.R.name, description: 'Otra' }),
  () => { code(200); pm.test('description updated', () => pm.expect(resp().description).to.eql('Otra')); });
putCase('U-03', 'Cambiar capitalizacion/acentos del propio nombre', async () => ({ R: await mk(`QA${runId} U03 Futbol`) }), () => `{"name":"QA${runId} U03 FÚTBOL"}`,
  async () => { code(200); const j = resp(); pm.test('new text', () => pm.expect(j.name).to.eql(`QA${runId} U03 FÚTBOL`)); await rereadEquals(j); });
putCase('U-04', 'Asignar padre a una raiz sin hijos', async () => ({ R1: await mk(N('U04 R1')), R: await mk(N('U04 R2')) }), (X) => ({ name: X.R.name, parentSportId: X.R1.id }),
  async (X) => { code(200); pm.test('parent set', () => pm.expect(resp().parentSport).to.eql({ id: X.R1.id, name: X.R1.name })); const g = await get(X.R1.id); pm.test('R1 subSportsCount 1', () => pm.expect(g.json.subSportsCount).to.eql(1)); });
putCase('U-05', 'Mover un subdeporte a otra raiz', async () => { const R1 = await mk(N('U05 R1')); const R2 = await mk(N('U05 R2')); const R = await mk(N('U05 Hijo'), { parentSportId: R1.id }); return { R1, R2, R }; },
  (X) => ({ name: X.R.name, parentSportId: X.R2.id }),
  async (X) => { code(200); pm.test('moved', () => pm.expect(resp().parentSportId).to.eql(X.R2.id)); const a = await get(X.R1.id); const b = await get(X.R2.id); pm.test('counts R1=0 R2=1', () => { pm.expect(a.json.subSportsCount).to.eql(0); pm.expect(b.json.subSportsCount).to.eql(1); }); });
putCase('U-06', 'parentSportId null convierte en raiz', async () => { const P = await mk(N('U06 Raiz')); const R = await mk(N('U06 Hijo'), { parentSportId: P.id }); return { P, R }; }, (X) => ({ name: X.R.name, parentSportId: null }),
  async (X) => { code(200); const j = resp(); pm.test('root now', () => { pm.expect(j.parentSportId).to.eql(null); pm.expect(j.parentSport).to.eql(null); }); const g = await get(X.P.id); pm.test('old parent count 0', () => pm.expect(g.json.subSportsCount).to.eql(0)); });
putCase('U-07', 'parentSportId omitido tambien deja raiz', async () => { const P = await mk(N('U07 Raiz')); const R = await mk(N('U07 Hijo'), { parentSportId: P.id }); return { P, R }; }, (X) => ({ name: X.R.name }),
  () => { code(200); pm.test('root now', () => pm.expect(resp().parentSportId).to.eql(null)); });
putCase('U-08', 'description omitida queda null (D10)', async () => ({ R: await mk(N('U08 Desc'), { description: 'Con texto' }) }), (X) => ({ name: X.R.name }),
  () => { code(200); pm.test('description null', () => pm.expect(resp().description).to.eql(null)); });
putCase('U-09', 'PUT no cambia active', async () => ({ R: await mkInactive(N('U09 Inactivo')) }), () => ({ name: N('U09 Inactivo editado') }),
  async () => { code(200); const j = resp(); pm.test('still inactive', () => pm.expect(j.active).to.eql(false)); await rereadEquals(j); });
putCase('U-10', 'Editar una raiz con hijos sin tocar la jerarquia', async () => { const R = await mk(N('U10 Raiz')); const H1 = await mk(N('U10 H1'), { parentSportId: R.id }); const H2 = await mk(N('U10 H2'), { parentSportId: R.id }); return { R, H1, H2 }; }, () => ({ name: N('U10 Raiz editada') }),
  async (X) => { code(200); pm.test('subSportsCount 2', () => pm.expect(resp().subSportsCount).to.eql(2)); const g = await get(X.H1.id); pm.test('child still points to R', () => pm.expect(g.json.parentSportId).to.eql(X.R.id)); });
putCase('U-11', 'Editar subdeporte con padre inactivo sin cambiar de padre (D7)', async () => { const P = await mk(N('U11 Raiz')); const R = await mk(N('U11 Hijo'), { parentSportId: P.id }); await deact(R.id); await deact(P.id); return { P, R }; },
  (X) => ({ name: X.R.name, description: 'x', parentSportId: X.P.id }), () => { code(200); pm.test('description updated', () => pm.expect(resp().description).to.eql('x')); });
putCase('U-12', 'Trim del nombre en PUT', async () => ({ R: await mk(N('U12 Original')) }), () => ({ name: `   ${N('U12 Trim')}   ` }),
  () => { code(200); pm.test('trimmed', () => pm.expect(resp().name).to.eql(N('U12 Trim'))); });
putCase('U-13', 'Deporte inexistente', none, () => ({ name: N('U13 x') }), () => bizErr(404, 'NOT_FOUND'), '2147483647');
putCase('U-14', 'Id no numerico', none, () => ({ name: N('U14 x') }), () => bizErr(400, 'INVALID_OPERATION'), 'abc');
putCase('U-15', 'Id inexistente y cuerpo invalido (Q5: gana 400)', none, () => ({ name: '' }), () => valErr('name'), '2147483647');
const uVal = (id, title, body, keys) => putCase(id, title, `async () => ({ R: await mk(N(${JSON.stringify(id)} + ' Base'), { description: 'orig' }) })`, body, `async (X) => { valErr(${keys.map((k) => JSON.stringify(k)).join(',')}); const g = await get(X.R.id); pm.test('stored state unchanged', () => { pm.expect(g.json.name).to.eql(X.R.name); pm.expect(g.json.description).to.eql('orig'); }); }`);
uVal('U-16', 'Cuerpo {}', () => ({}), ['name']);
uVal('U-17', 'name solo espacios', () => ({ name: '   ' }), ['name']);
uVal('U-18', 'name de 121 caracteres', () => ({ name: padTo(N('U18'), 121) }), ['name']);
uVal('U-19', 'description de 501 caracteres', (X) => ({ name: X.R.name, description: 'd'.repeat(501) }), ['description']);
uVal('U-20', 'parentSportId no numerico', (X) => ({ name: X.R.name, parentSportId: 'abc' }), ['parentSportId']);
uVal('U-21', 'parentSportId cero', (X) => ({ name: X.R.name, parentSportId: 0 }), ['parentSportId']);
uVal('U-22', 'Campo no permitido active', (X) => ({ name: X.R.name, active: false }), ['active']);
putCase('U-23', 'Nombre de otro deporte', async () => ({ R1: await mk(N('U23 R1')), R: await mk(N('U23 R2'), { description: 'orig2' }) }), (X) => ({ name: X.R1.name }), () => bizErr(409, 'ALREADY_EXISTS'));
putCase('U-24', 'Nombre de otro con otra capitalizacion y sin acentos', async () => ({ R1: await mk(`QA${runId} U24 Fútbol`), R: await mk(N('U24 R2')) }), () => `{"name":"qa${runId} u24 FUTBOL"}`, () => bizErr(409, 'ALREADY_EXISTS'));
add('U-25', 'GET', { title: 'Un PUT rechazado no cambia lo guardado', setup: async () => { const R1 = await mk(N('U25 R1')); const R = await mk(N('U25 R2'), { description: 'orig' }); const r = await put(R.id, { name: R1.name }); if (r.code !== 409) throw new Error('PUT expected 409, got ' + r.code); return { R }; },
  path: (X) => '/sports/' + X.R.id, test: (X) => { code(200); pm.test('original name and description kept', () => { pm.expect(resp().name).to.eql(X.R.name); pm.expect(resp().description).to.eql('orig'); }); } });
putCase('U-26', 'Padre inexistente', async () => ({ R: await mk(N('U26 Base')) }), (X) => ({ name: X.R.name, parentSportId: 2147483647 }), () => bizErr(404, 'NOT_FOUND'));
putCase('U-27', 'Un deporte no puede ser su propio padre', async () => ({ R: await mk(N('U27 Base')) }), (X) => ({ name: X.R.name, parentSportId: X.R.id }), () => bizErr(400, 'INVALID_OPERATION'));
putCase('U-28', 'Ciclo directo: A padre de B, se intenta B padre de A', async () => { const R = await mk(N('U28 A')); const B = await mk(N('U28 B'), { parentSportId: R.id }); return { R, B }; }, (X) => ({ name: X.R.name, parentSportId: X.B.id }),
  async (X) => { bizErr(400, 'INVALID_OPERATION'); const a = await get(X.R.id); const b = await get(X.B.id); pm.test('A still root, B still child', () => { pm.expect(a.json.parentSportId).to.eql(null); pm.expect(b.json.parentSportId).to.eql(X.R.id); }); });
putCase('U-29', 'Ciclo indirecto: armar la cadena A->B->C', async () => { const A = await mk(N('U29 A')); const B = await mk(N('U29 B'), { parentSportId: A.id }); const R = await mk(N('U29 C')); return { A, B, R }; }, (X) => ({ name: X.R.name, parentSportId: X.B.id }),
  async (X) => { bizErr(400, 'INVALID_OPERATION', X.B.name); const c = await get(X.R.id); pm.test('C still root', () => pm.expect(c.json.parentSportId).to.eql(null)); });
putCase('U-30', 'Mover un deporte con hijos bajo otro padre', async () => { const R = await mk(N('U30 R1')); await mk(N('U30 Hijo'), { parentSportId: R.id }); const R2 = await mk(N('U30 R2')); return { R, R2 }; }, (X) => ({ name: X.R.name, parentSportId: X.R2.id }),
  async (X) => { bizErr(400, 'INVALID_OPERATION'); const g = await get(X.R.id); pm.test('R1 still root', () => pm.expect(g.json.parentSportId).to.eql(null)); });
putCase('U-31', 'Mover bajo un padre inactivo', async () => ({ R: await mk(N('U31 Base')), Ri: await mkInactive(N('U31 Inactivo')) }), (X) => ({ name: X.R.name, parentSportId: X.Ri.id }), () => bizErr(409, 'INVALID_STATE'));

// =========================================================================
folder('GD-01 / V Activar y desactivar (PATCH)');
const patch = (id, title, setup, action, test, idv) => add(id, 'PATCH', { title, setup, path: `(X) => '/sports/' + ${idv ? (idv.startsWith('@') ? idv.slice(1) : JSON.stringify(idv)) : 'X.R.id'} + '/${action}'`, test });
patch('V-01', 'Desactivar un deporte activo sin hijos', async () => ({ R: await mk(N('V01 Base')) }), 'deactivate', async (X) => {
  code(200); const j = resp(); pm.test('inactive', () => pm.expect(j.active).to.eql(false)); await rereadEquals(j);
  const d = await call('GET', `/sports?name=${enc(X.R.name)}`); const a = await call('GET', `/sports?all=true&name=${enc(X.R.name)}`);
  pm.test('not in default list but in all=true', () => { pm.expect(ids(d.json)).to.not.include(X.R.id); pm.expect(ids(a.json)).to.include(X.R.id); }); });
patch('V-02', 'Desactivar es idempotente', async () => ({ R: await mkInactive(N('V02 Inactivo')) }), 'deactivate', () => { code(200); pm.test('still inactive', () => pm.expect(resp().active).to.eql(false)); });
patch('V-03', 'Bloqueado con subdeportes activos (hijos mixtos)', async () => { const R = await mk(N('V03 Raiz')); const H = await mk(N('V03 Activo'), { parentSportId: R.id }); const Hi = await mk(N('V03 Inactivo'), { parentSportId: R.id }); await deact(Hi.id); return { R, H, Hi }; }, 'deactivate',
  async (X) => { bizErr(409, 'INVALID_STATE', 'subdeporte'); const g = await get(X.R.id); pm.test('R still active', () => pm.expect(g.json.active).to.eql(true)); });
patch('V-04', 'Permitido con todos los hijos inactivos; los hijos no cambian', async () => { const R = await mk(N('V04 Raiz')); const H1 = await mkInactive(N('V04 H1'), { parentSportId: R.id }); const H2 = await mkInactive(N('V04 H2'), { parentSportId: R.id }); return { R, H1, H2 }; }, 'deactivate',
  async (X) => { code(200); pm.test('R inactive', () => pm.expect(resp().active).to.eql(false)); const s = await call('GET', `/sports/${X.R.id}/subsports?all=true`); pm.test('children still inactive and listed', () => { pm.expect(s.json).to.have.lengthOf(2); s.json.forEach((c) => pm.expect(c.active).to.eql(false)); }); });
patch('V-05', 'Desactivar un subdeporte no afecta al padre', async () => { const R = await mk(N('V05 Raiz')); const H = await mk(N('V05 Hijo'), { parentSportId: R.id }); return { R, H }; }, 'deactivate',
  async (X) => { code(200); pm.test('H inactive', () => pm.expect(resp().active).to.eql(false)); const g = await get(X.R.id); pm.test('parent still active', () => pm.expect(g.json.active).to.eql(true)); }, '@X.H.id');
patch('V-06', 'Desactivar inexistente', none, 'deactivate', () => bizErr(404, 'NOT_FOUND'), '2147483647');
patch('V-07', 'Desactivar con id no numerico', none, 'deactivate', () => bizErr(400, 'INVALID_OPERATION'), 'abc');
patch('V-08', 'Activar un deporte inactivo', async () => ({ R: await mkInactive(N('V08 Inactivo')) }), 'activate', async () => { code(200); const j = resp(); pm.test('active', () => pm.expect(j.active).to.eql(true)); await rereadEquals(j); });
patch('V-09', 'Activar uno ya activo (D6)', async () => ({ R: await mk(N('V09 Activo')) }), 'activate', () => { code(200); pm.test('still active', () => pm.expect(resp().active).to.eql(true)); });
patch('V-10', 'No se activa un subdeporte con padre inactivo', async () => { const P = await mk(N('V10 Raiz')); const R = await mk(N('V10 Hijo'), { parentSportId: P.id }); await deact(R.id); await deact(P.id); return { P, R }; }, 'activate',
  async (X) => { bizErr(409, 'INVALID_STATE', X.P.name); const g = await get(X.R.id); pm.test('child still inactive', () => pm.expect(g.json.active).to.eql(false)); });
patch('V-11', 'Se activa un subdeporte con padre activo', async () => { const P = await mk(N('V11 Raiz')); const R = await mk(N('V11 Hijo'), { parentSportId: P.id }); await deact(R.id); return { P, R }; }, 'activate', () => { code(200); pm.test('active', () => pm.expect(resp().active).to.eql(true)); });
patch('V-12', 'Activar una raiz no reactiva a sus hijos inactivos', async () => { const R = await mk(N('V12 Raiz')); const Hi = await mkInactive(N('V12 Hijo'), { parentSportId: R.id }); await deact(R.id); return { R, Hi }; }, 'activate',
  async (X) => { code(200); pm.test('R active', () => pm.expect(resp().active).to.eql(true)); const g = await get(X.Hi.id); pm.test('child still inactive', () => pm.expect(g.json.active).to.eql(false)); });
patch('V-13', 'Activar inexistente', none, 'activate', () => bizErr(404, 'NOT_FOUND'), '2147483647');
patch('V-14', 'Activar con id no numerico', none, 'activate', () => bizErr(400, 'INVALID_OPERATION'), 'abc');

// =========================================================================
folder('GD-01 / E Eliminar (DELETE /sports/:id)');
const delCase = (id, title, setup, test, idv) => add(id, 'DELETE', { title, setup, path: `(X) => '/sports/' + ${idv ? JSON.stringify(idv) : 'X.R.id'}`, test });
delCase('E-01', 'Eliminar un deporte hoja sin dependencias', async () => ({ R: await mk(N('E01 Hoja')) }), async (X) => { code(204); emptyBody(); const g = await get(X.R.id); pm.test('GET after delete is 404', () => pm.expect(g.code).to.eql(404)); });
delCase('E-02', 'Eliminar un deporte inactivo sin dependencias', async () => ({ R: await mkInactive(N('E02 Inactivo')) }), async (X) => { code(204); emptyBody(); const g = await get(X.R.id); pm.test('GET after delete is 404', () => pm.expect(g.code).to.eql(404)); });
delCase('E-03', 'Eliminar un subdeporte hoja; el padre queda intacto', async () => { const P = await mk(N('E03 Raiz')); const R = await mk(N('E03 Hijo'), { parentSportId: P.id }); return { P, R }; },
  async (X) => { code(204); const g = await get(X.P.id); pm.test('parent intact, subSportsCount 0', () => { pm.expect(g.code).to.eql(200); pm.expect(g.json.active).to.eql(true); pm.expect(g.json.subSportsCount).to.eql(0); }); });
delCase('E-04', 'Eliminar al padre tras eliminar su unico hijo', async () => { const R = await mk(N('E04 Raiz')); const H = await mk(N('E04 Hijo'), { parentSportId: R.id }); await step('delete child', del(H.id), 204); return { R }; },
  async (X) => { code(204); const g = await get(X.R.id); pm.test('GET after delete is 404', () => pm.expect(g.code).to.eql(404)); });
delCase('E-05', 'Raiz con subdeporte activo', async () => { const R = await mk(N('E05 Raiz')); const H = await mk(N('E05 Hijo'), { parentSportId: R.id }); return { R, H }; },
  async (X) => { bizErr(409, 'INVALID_STATE', ['subdeporte', X.R.name]); const a = await get(X.R.id); const b = await get(X.H.id); pm.test('nothing was deleted', () => { pm.expect(a.code).to.eql(200); pm.expect(b.code).to.eql(200); }); });
delCase('E-06', 'Raiz cuyo unico hijo esta inactivo', async () => { const R = await mk(N('E06 Raiz')); const Hi = await mkInactive(N('E06 Hijo'), { parentSportId: R.id }); return { R, Hi }; },
  async (X) => { bizErr(409, 'INVALID_STATE', '1 subdeporte'); const a = await get(X.R.id); const b = await get(X.Hi.id); pm.test('both still exist', () => { pm.expect(a.code).to.eql(200); pm.expect(b.code).to.eql(200); }); });
delCase('E-07', 'Eliminar inexistente', none, () => bizErr(404, 'NOT_FOUND'), '2147483647');
delCase('E-08', 'Eliminar con id no numerico', none, () => bizErr(400, 'INVALID_OPERATION'), 'abc');
delCase('E-09', 'Segundo DELETE del mismo id', async () => { const R = await mk(N('E09 Hoja')); await step('first delete', del(R.id), 204); return { R }; }, () => bizErr(404, 'NOT_FOUND'));
delCase('E-10', 'Deporte con equipo asociado (fixture Tenis)', async () => ({ R: await fixture('Tenis') }),
  async (X) => { bizErr(409, 'INVALID_STATE', '1 equipo asociado'); const g = await get(X.R.id); pm.test('sport still exists', () => pm.expect(g.code).to.eql(200)); });
delCase('E-11', 'Deporte con torneos (fixture Atletismo)', async () => ({ R: await fixture('Atletismo') }),
  async (X) => { bizErr(409, 'INVALID_STATE', '3 torneos'); const g = await get(X.R.id); pm.test('sport still exists', () => pm.expect(g.code).to.eql(200)); });
delCase('E-12', 'Subdeportes, equipo y torneos a la vez (fixture Baloncesto)', async () => ({ R: await fixture('Baloncesto') }),
  async (X) => { bizErr(409, 'INVALID_STATE', ['2 subdeportes', '1 equipo asociado', '3 torneos']); const s = await call('GET', `/sports/${X.R.id}/subsports?all=true`); pm.test('sport and its 2 children still exist', () => pm.expect(s.json).to.have.lengthOf(2)); });

// =========================================================================
folder('GD-01 / T Transversales');
add('T-01', 'OPTIONS', { title: 'Preflight de PUT desde el frontend', setup: none, path: () => '/sports/1',
  headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'PUT' },
  test: () => { code(204); pm.test('PUT allowed for http://localhost:3000', () => { pm.expect(pm.response.headers.get('Access-Control-Allow-Methods')).to.include('PUT'); pm.expect(pm.response.headers.get('Access-Control-Allow-Origin')).to.eql('http://localhost:3000'); }); } });

// =========================================================================
folder('99 Cleanup');
add('Z-01', 'GET', { setupRequest: true, title: 'Cleanup: borra por API todo lo creado (hijos primero)', setup: async () => {
    let created = JSON.parse(pm.collectionVariables.get('created') || '[]');
    created.sort((a, b) => (b.parent !== null) - (a.parent !== null));
    let pending = created;
    for (let pass = 0; pass < 4 && pending.length; pass++) {
      const next = [];
      for (const s of pending) { const r = await del(s.id); if (r.code !== 204 && r.code !== 404) next.push(s); }
      pending = next;
    }
    return { total: created.length, left: pending.length };
  }, path: () => `/sports?all=true&name=${enc('QA' + runId)}`, test: (X) => {
    code(200); pm.test('every sport created by this run was removed through the API', () => { pm.expect(X.left).to.eql(0); pm.expect(resp()).to.eql([]); }); } });

// ---------- assemble ----------
const conv = (src) => {
  let t = String(src);
  const m = t.match(/^async\s*\(([^)]*)\)\s*=>\s*/);
  if (!m) return t;
  const rest = t.slice(m[0].length);
  const body = rest.startsWith('{') ? rest : `{ return ${rest}; }`;
  return `function* (${m[1]}) ${body.replace(/\bawait\b/g, 'yield')}`;
};
const wrap = (kind, body) => ({ listen: kind, script: { type: 'text/javascript', exec: body.split('\n') } });
const items = (f) => f.items.map((c) => {
  const hasBody = c.body !== undefined;
  const pre = `${PRELUDE}
let X = {};
runIt((function* () {
  try {
    X = yield cr(${conv(c.setup)});
    pm.variables.set('path', (${c.path})(X));
    ${hasBody ? `const __b = (${c.body})(X); pm.variables.set('body', typeof __b === 'string' ? __b : JSON.stringify(__b));` : ''}
    pm.variables.set('ctx', JSON.stringify(X || {}));
  } catch (e) {
    pm.variables.set('setupError', String(e && e.message || e));
    pm.variables.set('path', '/sports/setup-failed');
  }
})())(() => {});`;
  const test = `${PRELUDE}
runIt((function* () {
  try {
    pm.test('setup completed', () => pm.expect(pm.variables.get('setupError') || '').to.eql(''));
    const X = JSON.parse(pm.variables.get('ctx') || '{}');
    yield cr(${conv(c.test)}, X);
    if (pm.request.method === 'POST' && pm.response.code === 201) track(resp());
  } catch (e) {
    pm.test('script error: ' + (e && e.message), () => { throw e; });
  }
})())(() => {});`;
  const header = [{ key: 'Content-Type', value: 'application/json' }, ...Object.entries(c.headers || {}).map(([key, value]) => ({ key, value }))];
  const request = { method: c.method, header, url: '{{baseUrl}}{{path}}' };
  if (hasBody) request.body = { mode: 'raw', raw: '{{body}}' };
  return { name: `${c.id} ${c.title}`, event: [wrap('prerequest', pre), wrap('test', test)], request };
});

const collection = {
  info: {
    name: 'MsSports',
    description: 'HU-GD-01 Gestionar deportes. Run order: npm run seed, newman, node postman/fixtures/teardown.mjs. See docs/pruebas/HU-GD-01-matriz.md.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  event: [wrap('prerequest', "if (!pm.collectionVariables.get('runId')) { pm.collectionVariables.set('runId', String(Date.now())); }")],
  variable: [{ key: 'created', value: '[]' }],
  item: folders.map((f) => ({ name: f.name, item: items(f) })),
};
writeFileSync(OUT, JSON.stringify(collection, null, 2) + '\n', 'utf8');
const total = folders.reduce((n, f) => n + f.items.filter((i) => !i.setupRequest).length, 0);
console.log('cases:', total, 'setup/cleanup requests:', folders.reduce((n, f) => n + f.items.filter((i) => i.setupRequest).length, 0));
