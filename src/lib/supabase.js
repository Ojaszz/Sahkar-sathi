// Minimal Supabase REST client (PostgREST) — hand-rolled so there are ZERO native
// deps and it works in Expo Go exactly as-is. All 4 hackathon phones hit the same
// project; the anon key is designed to be embedded in client apps.
//
// Override via .env (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).
// The bundled values below are the demo project's public anon credentials.

import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mbzsuixxbdsrcimwnqps.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ienN1aXh4YmRzcmNpbXducXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MzE5ODUsImV4cCI6MjEwNTEwNzk4NX0.ZMmr6Vd2Q4K8eIy9oqcq0gCCZZd5F4B1_8r1f5fqh78';

// ---- Board URL override -----------------------------------------------------
// The demo can run against EITHER the Supabase project above (any network) OR a
// same-WiFi board server (server/board.js) running on the demo laptop — no
// Supabase needed. The role-setup screen stores the chosen address here; an
// empty value keeps the bundled Supabase URL. Read per request so a switch takes
// effect on the very next poll (the sync loop calls these every ~1.5 s).
const BOARD_KEY = 'ss_board_url';
let boardOverride = null;
let boardOverrideLoaded = false;

async function loadBoardOverride() {
  if (boardOverrideLoaded) return boardOverride;
  boardOverrideLoaded = true;
  try {
    boardOverride = await AsyncStorage.getItem(BOARD_KEY);
  } catch {
    boardOverride = null;
  }
  return boardOverride;
}

export async function setBoardUrl(url) {
  boardOverride = url && url.trim() ? url.trim().replace(/\/+$/, '') : null;
  boardOverrideLoaded = true;
  try {
    if (boardOverride) await AsyncStorage.setItem(BOARD_KEY, boardOverride);
    else await AsyncStorage.removeItem(BOARD_KEY);
  } catch {}
  return boardOverride;
}

export async function getBoardUrl() {
  const ov = await loadBoardOverride();
  return ov || SUPABASE_URL;
}

// The base URL used for the DATA board (/rest/v1/*). When a local board is set
// we use it verbatim; otherwise the bundled Supabase project.
async function dataBaseUrl() {
  return (await loadBoardOverride()) || SUPABASE_URL;
}

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// Build a PostgREST query string from `{ col: 'eq.5', worker_id: 'is.null' }`
function qs(params = {}) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

async function http(path, options = {}) {
  const base = await dataBaseUrl();
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      ...options,
      headers: { ...HEADERS, ...(options.headers || {}) },
    });
  } catch (e) {
    throw new Error('Network error — check the phone is online: ' + e.message);
  }
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg = (json && (json.message || json.error)) || `HTTP ${res.status}`;
    throw new Error(`Supabase ${res.status}: ${msg}`);
  }
  return json;
}

export const supabase = {
  get(table, params = {}) {
    return http(`/rest/v1/${table}${qs(params)}`, { method: 'GET' });
  },
  insert(table, row) {
    return http(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
  },
  // Filter like `{ id: 'eq.3' }`. Returns matching rows ([] when none matched).
  patch(table, filter, patch) {
    return http(`/rest/v1/${table}${qs(filter)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    });
  },
  // Upsert on a unique column (used for worker_profiles where id is the PK): the
  // row is inserted when new, otherwise merged over the existing row's fields.
  upsert(table, row, onConflict = 'id') {
    return http(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row),
    });
  },
  // Filter like `{ id: 'eq.3' }`; `{}` deletes every row (used by "start fresh").
  async remove(table, filter = {}) {
    await http(`/rest/v1/${table}${qs(filter)}`, { method: 'DELETE' });
  },
};

// Stable per-phone identity (persisted). The CUSTOMER phone uses this as its user.id.
let cachedDeviceId = null;
export async function deviceId() {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    const existing = await AsyncStorage.getItem('ss_device_id');
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }
  } catch {}
  const id = 'dev_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  cachedDeviceId = id;
  try {
    await AsyncStorage.setItem('ss_device_id', id);
  } catch {}
  return id;
}

// Tiny stable id for a new booking (client-generated so the customer's tracking
// coordinate — deterministically derived from it — matches before insert).
export function newBookingId() {
  return 'b' + Math.random().toString(36).slice(2, 8);
}

// Tiny id for a new chat message (client-generated so a sent message can be
// shown optimistically and reconciled against the polled copy by id).
export function newMessageId() {
  return 'm' + Math.random().toString(36).slice(2, 10);
}

// Tiny id for a new tag-along request row (client-generated, like messages).
export function newTagAlongId() {
  return 'ta' + Math.random().toString(36).slice(2, 10);
}

// Tiny id for a new emergency job row (client-generated, same pattern).
export function newEmergencyId() {
  return 'em' + Math.random().toString(36).slice(2, 10);
}

// ---- Board health check ------------------------------------------------------
// Validates a board URL (local or Supabase) is reachable and running the
// Sahkar Sathi demo.  The local board returns a JSON status at "/" — Supabase
// ignores that path but returns a non-5xx, which we accept as "reachable".
export async function checkBoard(url) {
  let res;
  try {
    res = await fetch(`${url.replace(/\/+$/, '')}/`, {
      method: 'GET',
      headers: HEADERS,
      signal: AbortSignal.timeout(4000),
    });
    return { ok: true, status: res.status };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

// ---- Email / password auth (Supabase GoTrue REST) ---------------------------
// Ends up on /auth/v1 (not /rest/v1). Signup returns a session immediately when
// "Confirm email" is OFF in the dashboard — which is the hackathon setup.
//
// The sign-in/sign-up responses include an access_token we keep so a later profile
// edit can PUT the user's own metadata back (GoTrue requires the user's own token,
// not the anon key, for /auth/v1/user).
let cachedAccessToken = null;
async function getAccessToken() {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const t = await AsyncStorage.getItem('ss_auth_token');
    if (t) cachedAccessToken = t;
    return cachedAccessToken;
  } catch {
    return cachedAccessToken;
  }
}
async function saveAccessToken(token) {
  if (!token) return;
  cachedAccessToken = token;
  try {
    await AsyncStorage.setItem('ss_auth_token', token);
  } catch {}
}

async function authFetch(path, body) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}${path}`, {
      method: 'POST',
      headers: HEADERS,
      // captcha_token null = the dashboard's default (captcha disabled)
      body: JSON.stringify({ ...body, gotrue_meta_security: { captcha_token: null } }),
    });
  } catch (e) {
    throw new Error('Network error — check the phone is online.');
  }
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg = (json && json.error_description) || (json && json.msg) || (json && json.message) || `HTTP ${res.status}`;
    throw new Error(`${msg}`);
  }
  if (json && json.access_token) saveAccessToken(json.access_token);
  return json;
}

export const supabaseAuth = {
  signUp(email, password, metadata = {}) {
    return authFetch('/auth/v1/signup', {
      email,
      password,
      data: metadata, // lands in user.user_metadata { name, role, location }
    });
  },
  signIn(email, password) {
    return authFetch('/auth/v1/token?grant_type=password', { email, password });
  },
  // Rewrite this user's user_metadata so a later sign-in rebuilds the same app
  // profile (skills, service area, onboarding flag, ...). Best-effort: the app
  // always keeps the profile in AsyncStorage too.
  async updateUser(metadata) {
    const token = await getAccessToken();
    if (!token) return null;
    let res;
    try {
      res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ data: metadata }),
      });
    } catch {
      return null;
    }
    if (!res.ok) return null;
    return res.json();
  },
};