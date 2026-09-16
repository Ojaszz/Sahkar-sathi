// Tag-along (mentor) store — a NEW worker asks an experienced catalogue worker to
// "take me along", and when the mentor completes + gets rated on a job, the
// customer's rating is mirrored to the junior so their rating can grow.
//
// The request/response itself lives in the `tag_alongs` board (synced by syncStore
// every ~1.5 s, exactly like bookings + messages). The "messaging" feel rides the
// SAME messages table: the request seeds a worker→worker message (customer_id =
// junior id, worker_id = mentor id), and the mentor's reply is a message back — so
// both phones' existing chat poll picks both threads up with zero new infra.

import { create } from 'zustand';
import { supabase, newTagAlongId, newMessageId } from '../lib/supabase';
import { TAG_ALONG_LIMIT } from '../utils/constants';

function rowToLocal(r) {
  return {
    id: String(r.id),
    juniorId: r.junior_id || '',
    juniorName: r.junior_name || 'New member',
    mentorId: r.mentor_id || '',
    mentorName: r.mentor_name || '',
    service: r.service || '',
    status: r.status || 'pending',
    bookingId: r.booking_id || null,
    rating: r.rating ?? null,
    time: r.created_at || new Date().toISOString(),
  };
}

// Insert a worker→worker message into the shared messages board (best-effort, like
// chatStore.send). Both the junior and mentor already match this thread: the chat
// poll filters or=(customer_id.eq.<me>,worker_id.eq.<me>).
async function seedMessage({ customerId, workerId, senderId, senderName, senderRole, text }) {
  const msg = {
    id: newMessageId(),
    customer_id: customerId,
    worker_id: workerId,
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    text,
    created_at: new Date().toISOString(),
  };
  try {
    await supabase.insert('messages', msg);
  } catch {
    /* best-effort — the tag-along row still syncs */
  }
}

export const useTagAlongStore = create((set, get) => ({
  rows: [], // all tag-alongs involving THIS phone (junior or mentor side)

  mergeRemote(rows) {
    if (!rows || !rows.length) return;
    const next = [...get().rows];
    for (const r of rows) {
      const local = rowToLocal(r);
      const idx = next.findIndex((x) => x.id === local.id);
      if (idx >= 0) next[idx] = local;
      else next.push(local);
    }
    next.sort((a, b) => (a.time < b.time ? -1 : 1));
    set({ rows: next });
  },

  // Junior asks a mentor. Inserts the pending row AND seeds the opening chat
  // message so the mentor sees a real conversation in their Chat tab.
  // Refuses once the junior has completed TAG_ALONG_LIMIT shared jobs.
  async requestMentor({ juniorId, juniorName, mentorId, mentorName, service }) {
    if (get().completedFor(juniorId) >= TAG_ALONG_LIMIT) return;
    const id = newTagAlongId();
    const row = {
      id,
      junior_id: juniorId,
      junior_name: juniorName,
      mentor_id: mentorId,
      mentor_name: mentorName,
      service: service || '',
      status: 'pending',
    };
    get().mergeRemote([{ ...row, created_at: new Date().toISOString() }]);
    try {
      await supabase.insert('tag_alongs', row);
    } catch {
      /* best-effort */
    }
    await seedMessage({
      customerId: juniorId,
      workerId: mentorId,
      senderId: juniorId,
      senderName: juniorName,
      senderRole: 'worker',
      text: `Hi ${mentorName}! 🙏 I'm new to the cooperative and just getting started. Could you take me along on your next ${service} job so I can learn the ropes? I'd really appreciate it.`,
    });
  },

  // Mentor accepts / rejects a pending request.
  async respond(id, status) {
    const row = get().rows.find((r) => r.id === id);
    if (!row) return;
    const next = get().rows.map((r) => (r.id === id ? { ...r, status } : r));
    set({ rows: next });
    try {
      await supabase.patch('tag_alongs', { id: `eq.${id}` }, { status });
    } catch {
      /* best-effort */
    }
    if (status === 'accepted' && row.juniorName) {
      await seedMessage({
        customerId: row.juniorId,
        workerId: row.mentorId,
        senderId: row.mentorId,
        senderName: row.mentorName || 'Worker',
        senderRole: 'worker',
        text: `Hey ${row.juniorName}! 🙌 Alright, you're on. I'll take you along on my next job and we'll make sure your rating grows. Message me here anytime.`,
      });
    }
  },

  // Mentor completed a booking → attach the oldest ACCEPTED pair to it. One shot:
  // the row flips to 'completed' so it can never take two jobs. Matches by mentor
  // id (the booking's worker) so a mentor with several juniors shares job-by-job.
  async attachToCompleted(booking) {
    if (!booking?.workerId) return;
    const pair = get().rows.find(
      (r) => r.mentorId === booking.workerId && r.status === 'accepted' && r.juniorId
    );
    if (!pair) return;
    set({ rows: get().rows.map((r) => (r.id === pair.id ? { ...r, status: 'completed', bookingId: booking.id } : r)) });
    try {
      await supabase.patch('tag_alongs', { id: `eq.${pair.id}` }, { status: 'completed', booking_id: booking.id });
    } catch {
      /* best-effort */
    }
  },

  // Customer rated a completed booking → copy the rating onto any completed
  // tag-along pair attached to that booking (the junior earns the SAME stars).
  // Runs on the CUSTOMER phone, which never polls tag_alongs — so query the board
  // directly instead of reading local rows; the junior's phone picks it up on its
  // next poll and their ratingSnapshot updates.
  async shareRating({ bookingId, rating }) {
    if (!bookingId || rating == null) return;
    let rows;
    try {
      rows = await supabase.get('tag_alongs', {
        select: '*',
        booking_id: `eq.${bookingId}`,
        status: 'eq.completed',
      });
    } catch {
      return;
    }
    for (const t of rows || []) {
      try {
        await supabase.patch('tag_alongs', { id: `eq.${t.id}` }, { rating });
        get().mergeRemote([{ ...t, rating }]);
      } catch {
        /* best-effort */
      }
    }
  },

  // How many shared jobs this junior has COMPLETED — the graduation counter.
  completedFor(juniorId) {
    return get().rows.filter((r) => r.juniorId === juniorId && r.status === 'completed').length;
  },

  // What the junior side shows on screen, keyed by mentor id: the tag-along row
  // this phone (as the junior) has with a given mentor, or null if none yet.
  statusWithMentor(mentorId) {
    const mine = get().rows.find((r) => r.mentorId === mentorId);
    return mine || null;
  },

  reset() {
    set({ rows: [] });
  },
}));