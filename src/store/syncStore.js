// Cross-device sync engine for the 4-phone hackathon demo.
//
// Each phone polls the shared Supabase `bookings` table every ~1.5 s and merges
// whatever changed into the local bookingStore. The ONLY things that sync are
// booking rows and their status — the tracking animation itself stays local on
// the customer's phone, which the existing trackingStore already drives on
// `inProgress`. No websockets, no servers to run: plain HTTPS polling.

import { create } from 'zustand';
import { supabase, deviceId, newBookingId } from '../lib/supabase';
import { liveBus } from './bus';
import { useBookingStore } from './bookingStore';
import { useAuthStore } from './authStore';
import { useChatStore } from './chatStore';
import { useTagAlongStore } from './tagAlongStore';
import { useEmergenciesStore } from './emergenciesStore';
import { useWorkerDirectoryStore } from './workerDirectoryStore';
import { customerLocationFor } from '../utils/geo';
import { COOP_FEE_PERCENT } from '../utils/constants';

let pollTimer = null;
let lastSig = '';
let lastMsgSig = '';
let lastTagSig = '';
let lastWorkerSig = '';
let lastEmergSig = '';

const POLL_MS = 1500;

// Cheap change-detector so a poll only triggers re-renders when something moved.
function signature(rows) {
  return rows
    .map((r) => `${r.id}:${r.status}:${r.worker_id}:${r.customer_id}:${r.worker_name}`)
    .join('|');
}

// Server row -> the local booking shape the UI expects.
function mapRow(r) {
  return {
    id: String(r.id),
    service: r.service,
    workerId: r.worker_id || null,
    workerName: r.worker_name || '',
    customerId: r.customer_id || '',
    customerName: r.customer_name || 'Customer',
    status: r.status || 'requested',
    address: r.address || '',
    issue: r.issue || '',
    amount: r.amount ?? 0,
    coopFee: r.coop_fee ?? 0,
    date: r.date || (r.created_at || '').slice(0, 10),
    time: r.time || 'ASAP',
    payment: r.payment || 'unpaid',
    paymentMethod: r.payment_method || null,
    rating: r.rating ?? null,
    reviewed: !!r.reviewed,
    isLive: true,
  };
}

// Optimistically patch a booking into liveFeed + bookingStore (merging partials),
// so taps re-render immediately instead of waiting on the next poll / round-trip.
function applyLocal(patch) {
  const sync = useSyncStore.getState();
  const feed = sync.liveFeed.find((x) => x.id === patch.id);
  const book = useBookingStore.getState().getById(patch.id);
  const base = feed || book;
  if (!base) return null;
  const merged = { ...base, ...patch };
  useSyncStore.setState({
    liveFeed: sync.liveFeed.map((x) => (x.id === patch.id ? merged : x)),
  });
  useBookingStore.getState().mergeRemote(merged);
  return merged;
}

export const useSyncStore = create((set, get) => ({
  mode: 'live', // 'live' | 'mock'  (flip to 'mock' for a fully offline single-phone demo)
  online: false, // last poll succeeded
  connected: false,
  liveFeed: [], // mirror of the server table (worker phone feed consumes this)
  myDeviceId: null,

  async init() {
    if (get().mode !== 'live') return;
    const id = await deviceId();
    set({ myDeviceId: id });

    // Install the live handlers so bookingStore.createBooking / setStatus /
    // cancel / payment / review transparently hit Supabase instead of the mock.
    liveBus.create = get().publishBooking;
    liveBus.status = get().setStatus;
    liveBus.cancel = get().cancelBooking;
    liveBus.payment = get().setPayment;
    liveBus.review = get().addReview;

    if (!pollTimer) {
      pollTimer = setInterval(() => get().poll(), POLL_MS);
    }
    get().poll();
  },

  // Full teardown for a "start fresh" reset: stop polling, drop the bus wiring,
  // clear the server mirror. Re-init() brings everything back.
  stop() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    lastSig = '';
    lastMsgSig = '';
    lastTagSig = '';
    lastWorkerSig = '';
    lastEmergSig = '';
    liveBus.create = null;
    liveBus.status = null;
    liveBus.cancel = null;
    liveBus.payment = null;
    liveBus.review = null;
    set({ online: false, connected: false, liveFeed: [], myDeviceId: null });
  },

  async poll() {
    const self = get();
    if (self.mode !== 'live') return;
    try {
      const rows = await supabase.get('bookings', {
        select: '*',
        order: 'created_at.desc',
        limit: '50',
      });
      const sig = signature(rows || []);
      if (sig !== lastSig) {
        lastSig = sig;
        const merged = (rows || []).map(mapRow);
        set({ liveFeed: merged, online: true, connected: true });
        // Merge rows that belong to THIS phone into the local booking store.
        // Customer rows match the device id; worker rows match the STATIC worker
        // id the phone logged in as (w1/w2/...), because device ids differ.
        const myId = self.myDeviceId;
        const userId = useAuthStore.getState().user?.id;
        for (const b of merged) {
          if (
            b.customerId === myId ||
            b.workerId === myId ||
            (userId && b.workerId === userId)
          ) {
            useBookingStore.getState().mergeRemote(b);
          }
        }
      }
    } catch {
      set({ online: false });
    }

    // Chat messages that involve THIS phone (mine as customer or as worker).
    // Best-effort: if the `messages` table doesn't exist yet (SQL not run) we
    // simply stay silent instead of marking the board offline.
    try {
      const u = useAuthStore.getState().user;
      if (u?.id) {
        const rows = await supabase.get('messages', {
          select: '*',
          order: 'created_at.asc',
          limit: '200',
          or: `(customer_id.eq.${u.id},worker_id.eq.${u.id})`,
        });
        const sig = (rows || []).map((m) => `${m.id}:${m.created_at}`).join('|');
        if (sig !== lastMsgSig) {
          lastMsgSig = sig;
          useChatStore.getState().mergeRemoteMsgs(rows || []);
        }
      }
    } catch {}

    // Tag-along rows involving THIS phone (as junior or as mentor) — the "take me
    // along" request board. Best-effort; silently skipped until tag_alongs exists.
    try {
      const u = useAuthStore.getState().user;
      if (u?.id) {
        const rows = await supabase.get('tag_alongs', {
          select: '*',
          order: 'created_at.asc',
          limit: '200',
          or: `(junior_id.eq.${u.id},mentor_id.eq.${u.id})`,
        });
        const sig = (rows || []).map((t) => `${t.id}:${t.status}:${t.rating ?? ''}:${t.booking_id ?? ''}`).join('|');
        if (sig !== lastTagSig) {
          lastTagSig = sig;
          useTagAlongStore.getState().mergeRemote(rows || []);
        }
      }
    } catch {}

    // Emergency jobs — global board; drives the call-style overlay on worker phones.
    // Best-effort until the `emergencies` table exists.
    try {
      const rows = await supabase.get('emergencies', {
        select: '*',
        order: 'created_at.desc',
        limit: '20',
      });
      const sig = (rows || [])
        .map((e) => `${e.id}:${e.status}:${(e.rejected_by || []).join(',')}`)
        .join('|');
      if (sig !== lastEmergSig) {
        lastEmergSig = sig;
        useEmergenciesStore.getState().mergeRemote(rows || []);
      }
    } catch {}

    // Registered worker profiles — the customer's "new worker" half of the search.
    // Global board (any phone can be a customer); best-effort until the table exists.
    try {
      const rows = await supabase.get('worker_profiles', {
        select: '*',
        order: 'created_at.asc',
        limit: '200',
      });
      const sig = (rows || [])
        .map((p) => `${p.id}:${p.rating ?? ''}:${p.available ?? ''}:${p.rate ?? ''}`)
        .join('|');
      if (sig !== lastWorkerSig) {
        lastWorkerSig = sig;
        useWorkerDirectoryStore.getState().mergeRemote(rows || []);
      }
    } catch {}
  },

  // Customer phone creates a booking (status 'requested') visible to all workers.
  async publishBooking(payload) {
    const myId = get().myDeviceId;
    if (!myId) return null;
    const id = newBookingId();
    const [lat, lng] = customerLocationFor({ id });
    const amount = payload.amount || 500;
    const row = await supabase.insert('bookings', {
      id,
      service: payload.service,
      customer_id: myId,
      customer_name: payload.customerName || 'Customer',
      worker_id: payload.workerId || null, // static "preferred" face until a live worker claims
      worker_name: payload.workerName || '',
      status: 'requested',
      address: payload.address || 'FC Road, Pune',
      issue: payload.issue || '',
      amount,
      coop_fee: Math.round(amount * (COOP_FEE_PERCENT / 100)),
      date: payload.date, // customer's chosen slot survives the round-trip now
      time: payload.time,
      lat,
      lng,
    });
    const b = row && row[0] ? mapRow(row[0]) : null;
    if (b) useBookingStore.getState().mergeRemote(b);
    return b;
  },

  // Worker phone claims an open request. (Non-atomic for 3 humans — the first tap wins.)
  async acceptBooking(bookingId, workerId, workerName) {
    // Optimistic: flip the card to 'confirmed' THIS tap, before the round-trip,
    // so the worker never watches a spinner through a poll cycle.
    const opt = applyLocal({ id: bookingId, status: 'confirmed', workerId, workerName });
    try {
      const rows = await supabase.patch(
        'bookings',
        { id: `eq.${bookingId}`, status: 'eq.requested' },
        { worker_id: workerId, worker_name: workerName, status: 'confirmed' }
      );
      const b = rows && rows[0] ? mapRow(rows[0]) : null;
      if (b) applyLocal(b);
      if (!b && opt) {
        // Lost the race — another worker got there first. Revert to live reality.
        applyLocal({ id: bookingId, status: 'requested', workerId: null, workerName: '' });
      }
      return { ok: !!b, booking: b };
    } catch (e) {
      if (opt) applyLocal(opt);
      return { ok: false, error: e.message };
    }
  },

  async setStatus(bookingId, status) {
    if (get().mode !== 'live') return;
    const opt = applyLocal({ id: bookingId, status });
    try {
      const rows = await supabase.patch(
        'bookings',
        { id: `eq.${bookingId}` },
        { status }
      );
      const b = rows && rows[0] ? mapRow(rows[0]) : null;
      if (b) applyLocal(b);
      if (!b && opt && status === 'inProgress') {
        // PATCH failed (e.g. offline blip) — don't leave the UI stuck on 'inProgress'.
        applyLocal({ id: bookingId, status: 'confirmed' });
      }
      // Mentor completed a job → attach the oldest accepted tag-along pair to it,
      // so the junior's shared rating can land when the customer rates.
      if (status === 'completed' && b) {
        useTagAlongStore.getState().attachToCompleted(b);
      }
      if (status === 'inProgress') {
        // Our tracking screen auto-starts its sim when the booking is inProgress;
        // make sure the customer phone's store has the row before it animates.
      }
    } catch {}
  },

  async cancelBooking(bookingId) {
    await get().setStatus(bookingId, 'cancelled');
  },

  async setPayment(bookingId, method) {
    if (get().mode !== 'live') return;
    try {
      const rows = await supabase.patch(
        'bookings',
        { id: `eq.${bookingId}` },
        { payment: 'paid', payment_method: method || 'cash' }
      );
      const b = rows && rows[0] ? mapRow(rows[0]) : null;
      if (b) useBookingStore.getState().mergeRemote(b);
    } catch {}
  },

  async addReview(bookingId, rating, review) {
    if (get().mode !== 'live') return;
    try {
      const rows = await supabase.patch(
        'bookings',
        { id: `eq.${bookingId}` },
        { rating: rating || 5, reviewed: true }
      );
      const b = rows && rows[0] ? mapRow(rows[0]) : null;
      if (b) useBookingStore.getState().mergeRemote(b);
      // Customer rated the mentor's completed job → mirror the SAME stars onto the
      // junior's tag-along pair attached to that booking (their rating grows too).
      useTagAlongStore.getState().shareRating({ bookingId, rating: rating || 5 });
    } catch {}
  },
}));