// Live-tracking simulation engine.
// No real GPS in the demo — instead a worker marker is animated along a path from
// the worker's base location toward the customer, with distance/ETA recomputed each
// tick. State lives here (not on the booking) so live positions don't pollute the
// persisted mock backend, and intervals are cleaned up on unmount / logout.

import { create } from 'zustand';
import { getWorker } from '../data/workers';
import {
  customerLocationFor,
  roadPathFor,
  pathLength,
  pointAtPathFraction,
  remainingPathDistance,
  easeInOut,
} from '../utils/geo';

// Module-level interval registry (survives re-renders, cleared on logout)
const intervals = new Map();

// Demo pacing: worker "arrives" in ~14 s regardless of real distance (snappy pitch)
const DURATION_SECONDS = 14;
const TICK_MS = 700;

export const useTrackingStore = create((set, get) => ({
  live: {},

  startTracking(booking) {
    if (!booking || intervals.has(booking.id) || get().live[booking.id]) return;

    const worker = getWorker(booking.workerId);
    const workerStart = worker.location;
    const customer = customerLocationFor(booking);
    // Route along a plausible street path (city blocks), not a straight line
    const route = roadPathFor(workerStart, customer);
    const totalKm = pathLength(route);
    const totalMs = DURATION_SECONDS * 1000;

    const entry = {
      bookingId: booking.id,
      workerStart,
      customer,
      route,
      progress: 0,
      workerPos: workerStart,
      distance: totalKm,
      etaMin: Math.max(1, Math.ceil(totalKm * 1.2)),
      status: 'traveling',
    };
    set({ live: { ...get().live, [booking.id]: entry } });

    const startedAt = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / totalMs);
      const eased = easeInOut(progress);
      const pos = pointAtPathFraction(route, eased);
      const arrived = progress >= 1;
      const updated = {
        ...entry,
        progress,
        workerPos: pos,
        distance: arrived ? 0 : remainingPathDistance(route, eased),
        etaMin: Math.max(0, Math.ceil(totalKm * (1 - eased) * 1.2)),
        status: arrived ? 'arrived' : 'traveling',
      };
      set({ live: { ...get().live, [booking.id]: updated } });

      if (arrived) {
        clearInterval(id);
        intervals.delete(booking.id);
      }
    }, TICK_MS);

    intervals.set(booking.id, id);
  },

  getTracking(bookingId) {
    return get().live[bookingId] || null;
  },

  stopTracking(bookingId) {
    const id = intervals.get(bookingId);
    if (id) clearInterval(id);
    intervals.delete(bookingId);
    const { [bookingId]: _removed, ...rest } = get().live;
    set({ live: rest });
  },

  resetAll() {
    intervals.forEach((id) => clearInterval(id));
    intervals.clear();
    set({ live: {} });
  },
}));
