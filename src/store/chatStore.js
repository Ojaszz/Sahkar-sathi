// Live chat store — messages sync across phones over the SAME Supabase board the
// bookings use (polled every ~1.5 s by syncStore). There is no conversations table:
// a thread is just the (customer_id, worker_id) pair, and every message row carries
// both ids so either side can read and reply. The thread LISTS are still derived
// from bookings (already synced), so the chat tab needs no separate index.
import { create } from 'zustand';
import { supabase, newMessageId } from '../lib/supabase';

// Deterministic key both sides use for a customer<->worker thread.
export function chatKey(customerId, workerId) {
  return `${customerId}::${workerId}`;
}

export const useChatStore = create((set, get) => ({
  currentUser: null, // { id, name, role } — who is typing on THIS phone
  messagesByConv: {}, // convKey -> [msg...] ascending by time
  active: null, // { customerId, workerId } — the thread currently on screen

  setCurrentUser(user) {
    set({ currentUser: user });
  },

  setActive(thread) {
    set({ active: thread });
  },

  close() {
    set({ active: null });
  },

  // Convenience used by worker/[id].js → opens a thread from a worker's profile.
  openConversation(customerId, workerId) {
    set({ active: { customerId, workerId } });
  },

  // Optimistic local append, then insert the real row on the board. If the insert
  // fails (offline / table not created yet) the message still shows on THIS phone.
  async send(customerId, workerId, text) {
    const me = get().currentUser;
    if (!me || !text.trim()) return;
    const id = newMessageId();
    const msg = {
      id,
      customer_id: customerId,
      worker_id: workerId,
      sender_id: me.id,
      sender_name: me.name || (me.role === 'worker' ? 'Worker' : 'Customer'),
      sender_role: me.role || 'customer',
      text: text.trim(),
      created_at: new Date().toISOString(),
    };
    get().mergeRemoteMsgs([msg]);
    try {
      const rows = await supabase.insert('messages', msg);
      const row = rows && rows[0] ? rows[0] : null;
      if (row) get().mergeRemoteMsgs([msg]); // shallow re-merge to confirm
    } catch {
      /* stays local-only */
    }
  },

  // Emergency broadcast: sends "the problem" to a list of workers as message rows
  // on the shared board. Each worker phone's poll filter
  // `or=(customer_id.eq.me,worker_id.eq.me)` picks rows where worker_id == their
  // static id, so every available worker gets the thread within one poll cycle —
  // no new tables, just the existing messages board.
  async broadcastEmergency({ workers, customerId, customerName, problem, location }) {
    const text = `🚨 EMERGENCY — ${problem}${location ? ` — ${location}` : ''}. Please reply here or call me ASAP${customerName ? ` (${customerName})` : ''}!`;
    let sent = 0;
    for (const w of workers) {
      if (!w || !w.id) continue;
      const id = newMessageId();
      const msg = {
        id,
        customer_id: customerId,
        worker_id: w.id,
        sender_id: customerId,
        sender_name: customerName || 'Customer',
        sender_role: 'customer',
        text,
        created_at: new Date().toISOString(),
      };
      get().mergeRemoteMsgs([msg]);
      sent++;
      try {
        await supabase.insert('messages', msg);
      } catch {
        /* best-effort — stays on this phone at least */
      }
    }
    return sent;
  },

  // Greeting inserted once when a worker accepts a booking: the customer's thread
  // already has a real, synced first message from the actual worker — no typing
  // needed to make the live demo look alive.
  async greetFromWorker({ customerId, workerId, workerName, customerName, service }) {
    const id = newMessageId();
    const msg = {
      id,
      customer_id: customerId,
      worker_id: workerId,
      sender_id: workerId,
      sender_name: workerName || 'Worker',
      sender_role: 'worker',
      text: `Namaste ${customerName || 'friend'}! 🙏 I've accepted your ${service} job and I'm heading to your address. Message me here if anything changes.`,
      created_at: new Date().toISOString(),
    };
    get().mergeRemoteMsgs([msg]);
    try {
      await supabase.insert('messages', msg);
    } catch {
      /* best-effort */
    }
  },

  // Called by the sync engine on every poll with the rows that belong to this phone.
  mergeRemoteMsgs(rows) {
    if (!rows || !rows.length) return;
    const next = { ...get().messagesByConv };
    for (const r of rows) {
      const key = chatKey(r.customer_id, r.worker_id);
      const msg = {
        id: r.id,
        text: r.text || '',
        senderId: r.sender_id,
        senderName: r.sender_name || '',
        senderRole: r.sender_role || '',
        time: r.created_at || new Date().toISOString(),
      };
      const list = [...(next[key] || [])];
      const idx = list.findIndex((m) => m.id === msg.id);
      if (idx >= 0) list[idx] = msg;
      else list.push(msg);
      list.sort((a, b) => (a.time < b.time ? -1 : 1));
      next[key] = list;
    }
    set({ messagesByConv: next });
  },

  reset() {
    set({ currentUser: null, messagesByConv: {}, active: null });
  },
}));