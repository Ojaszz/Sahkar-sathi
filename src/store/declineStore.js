// Per-worker dismissal of live job requests.
//
// A worker tapping "Reject" on a request is a PERSONAL pass — it must NOT cancel
// the shared booking (that would kill the job for the customer and every other
// worker on the board). Instead we record the booking id as dismissed for THIS
// worker's phone and filter it out of their jobs list. The request stays live for
// everyone else until somebody accepts.
//
// Persisted per worker id so a pass sticks across app restarts.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ss_declined_v1';

export const useDeclineStore = create((set, get) => ({
  // workerId -> Set of dismissed booking ids (Set serialised as array on disk)
  byWorker: {},

  restore: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const byWorker = {};
        for (const [k, arr] of Object.entries(parsed)) {
          byWorker[k] = new Set(Array.isArray(arr) ? arr : []);
        }
        set({ byWorker });
      }
    } catch {
      /* ignore */
    }
  },

  isDeclined(workerId, bookingId) {
    return !!get().byWorker[workerId]?.has(bookingId);
  },

  decline(workerId, bookingId) {
    if (!workerId || !bookingId) return;
    const next = new Set(get().byWorker[workerId] || []);
    next.add(bookingId);
    const byWorker = { ...get().byWorker, [workerId]: next };
    set({ byWorker });
    const serialisable = {};
    for (const [k, s] of Object.entries(byWorker)) serialisable[k] = [...s];
    AsyncStorage.setItem(KEY, JSON.stringify(serialisable)).catch(() => {});
  },

  unDecline(workerId, bookingId) {
    const cur = get().byWorker[workerId];
    if (!cur || !cur.has(bookingId)) return;
    const next = new Set(cur);
    next.delete(bookingId);
    const byWorker = next.size ? { ...get().byWorker, [workerId]: next } : (({ [workerId]: _, ...rest }) => rest)(get().byWorker);
    set({ byWorker });
    const serialisable = {};
    for (const [k, s] of Object.entries(byWorker)) serialisable[k] = [...s];
    AsyncStorage.setItem(KEY, JSON.stringify(serialisable)).catch(() => {});
  },

  reset() {
    set({ byWorker: {} });
    AsyncStorage.removeItem(KEY).catch(() => {});
  },
}));