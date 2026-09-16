// Sahkar Sathi — Same-WiFi demo board
// ======================================
// A tiny, zero-dependency HTTP server that REPLACES Supabase for the 4-phone
// hackathon demo. It speaks the exact PostgREST dialect the app's hand-rolled
// client (src/lib/supabase.js) expects — GET /rest/v1/<table>?…, POST (insert),
// PATCH (update), DELETE, plus upsert — so no app code has to change aside from
// pointing the board URL at this laptop.
//
// Why it exists: the app's live demo state (bookings, chat messages, emergency
// jobs, tag-alongs, worker profiles) had to go through a Supabase project with
// tables + RLS the user creates by hand. If any of that is missing or the phone
// can't reach the project, "nothing works" — which is exactly the failure we
// kept hitting. This board runs ONE command on the demo laptop, and every phone
// on the same WiFi talks to it over plain HTTPS→HTTP REST. Live for the whole
// demo, "start fresh" is a one button press, and there is no remote dependency.
//
// Run:  node server/board.js      (prints the LAN IP to point phones at)

const { createServer } = require('node:http');
const { networkInterfaces } = require('node:os');

const PORT = Number(process.env.PORT || 4000);

// ---- In-memory tables (fresh each boot = a clean demo every time) ----------
// Row fields are FREE-FORM. The server only ever filters/sorts on the snake_case
// columns the app actually queries (created_at, id, customer_id, worker_id, …),
// so new fields can be added to the app without touching this file.
const TABLES = [
  'bookings',
  'messages',
  'emergencies',
  'tag_alongs',
  'worker_profiles',
];

const db = Object.fromEntries(TABLES.map((t) => [t, []]));

// ---- Tiny helpers -----------------------------------------------------------

function nowIso() {
  return new Date().toISOString();
}

// Parse `or=(customer_id.eq.X,worker_id.eq.Y)` style filters used by the chat and
// tag-along polls: row matches when ANY inner condition is true.
function matchesOr(cond, row) {
  const inner = cond.slice(1, -1); // strip the surrounding parentheses
  for (const part of inner.split(',')) {
    const eq = part.split('.eq.');
    if (eq.length === 2) {
      const [col, val] = eq;
      if (String(row[col] ?? '') === String(val)) return true;
    }
  }
  return false;
}

// Evaluate the `key=…` query params a GET/PATCH/DELETE can carry.
// Returns { order, limit, orFilter, filters } where filters is an array of
// { col, op, val } predicates. Ignores `select` (we always return the full row).
function parseQuery(url) {
  const q = {};
  for (const [k, v] of new URLSearchParams(url.split('?')[1] || '')) q[k] = v;

  let order = null;
  if (q.order) {
    const [col, dir] = q.order.split('.');
    order = { col, dir: dir === 'desc' ? -1 : 1 };
  }
  const limit = q.limit ? Number(q.limit) : null;

  const filters = [];
  for (const [k, v] of Object.entries(q)) {
    if (k === 'select' || k === 'order' || k === 'limit' || k === 'on_conflict' || k === 'or') continue;
    const dot = v.indexOf('.');
    if (dot < 0) continue;
    filters.push({ col: k, op: v.slice(0, dot), val: v.slice(dot + 1) });
  }

  return { order, limit, orFilter: q.or || null, filters };
}

function applyFilters(rows, filters, orFilter) {
  let out = rows;
  for (const f of filters) {
    out = out.filter((r) => {
      const actual = String(r[f.col] ?? '');
      switch (f.op) {
        case 'eq': return actual === String(f.val);
        case 'neq': return actual !== String(f.val);
        case 'is': // `is.null` / `is.true` are the only `is` uses in the app
          return f.val === 'null' ? r[f.col] == null : String(r[f.col]) === f.val;
        default: return true;
      }
    });
  }
  if (orFilter) out = out.filter((r) => matchesOr(orFilter, r));
  return out;
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*', // CORS: harmless, RN fetch ignores it anyway
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'apikey,authorization,content-type,prefer',
  });
  res.end(body === undefined ? '[]' : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch {
        resolve(null);
      }
    });
  });
}

function lanIp() {
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

// ---- Routes ----------------------------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');

  // Health check — phones hit this to prove the board is reachable.
  if (url.pathname === '/' && (req.method === 'GET' || req.method === 'HEAD')) {
    json(res, 200, {
      ok: true,
      app: 'sahkar-sathi-board',
      tables: TABLES.map((t) => ({ name: t, rows: db[t].length })),
      time: nowIso(),
    });
    return;
  }
  if (req.method === 'OPTIONS') {
    json(res, 200, {});
    return;
  }

  const m = url.pathname.match(/^\/rest\/v1\/([a-z_]+)\/?$/);
  if (!m) {
    json(res, 404, { message: `Not found: ${req.method} ${url.pathname}` });
    return;
  }
  const table = m[1];
  if (!TABLES.includes(table)) {
    json(res, 404, { message: `Unknown table: ${table}` });
    return;
  }

  const { order, limit, orFilter, filters } = parseQuery(url.toString());

  try {
    if (req.method === 'GET') {
      let rows = applyFilters(db[table], filters, orFilter);
      if (order) {
        rows = [...rows].sort((a, b) => {
          const av = a[order.col] ?? '';
          const bv = b[order.col] ?? '';
          return av < bv ? -1 : av > bv ? 1 : 0;
        });
        if (order.dir === -1) rows.reverse();
      }
      if (limit) rows = rows.slice(0, limit);
      json(res, 200, rows);
      return;
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const upsert = url.searchParams.get('on_conflict');
      const rows = Array.isArray(body) ? body : [body || {}];
      const out = rows.map((r) => {
        const w = { ...r };
        // Server-side timestamp: rows the app inserts carry a `time` DISPLAY string
        // ("ASAP", "09:00 AM") — using it as created_at made `order=created_at.desc`
        // sort bookings by ASCII and could bury a new request below a
        // `limit=50` poll window. A real timestamp keeps newest-first reliable.
        if (!w.created_at) w.created_at = nowIso();
        const existing = upsert ? db[table].find((x) => x[upsert] === w[upsert]) : null;
        if (upsert && existing) Object.assign(existing, w);
        else db[table].push(w);
        return existing || w;
      });
      json(res, 201, out);
      return;
    }

    if (req.method === 'PATCH') {
      const patch = (await readBody(req)) || {};
      const hits = applyFilters(db[table], filters, orFilter);
      for (const r of hits) Object.assign(r, patch);
      json(res, 200, hits);
      return;
    }

    if (req.method === 'DELETE') {
      const hits = applyFilters(db[table], filters, orFilter);
      for (const r of hits) db[table].splice(db[table].indexOf(r), 1);
      json(res, 200, hits);
      return;
    }

    json(res, 405, { message: `Method ${req.method} not allowed` });
  } catch (e) {
    json(res, 500, { message: String((e && e.message) || e) });
  }
});

server.listen(PORT, () => {
  const ip = lanIp();
  console.log('');
  console.log('  Sahkar Sathi — same-WiFi demo board');
  console.log('  ------------------------------------');
  console.log(`  Existing live here:  http://localhost:${PORT}`);
  console.log(`  Phones point at:     http://${ip}:${PORT}`);
  console.log('');
  console.log('  On each Expo Go phone, open the role-setup screen and enter the');
  console.log('  "Phones point at" address above as the local board. Everything');
  console.log('  (booking, chat, emergency) then syncs over this laptop only.');
  console.log('');
  console.log('  Keep this terminal window open for the whole demo.  Ctrl+C stops it.');
  console.log('');
});