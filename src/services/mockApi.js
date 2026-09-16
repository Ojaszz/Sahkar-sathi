// Mock API layer — simulates a backend. In demo mode it operates fully in memory
// (and optionally persists to AsyncStorage) so the app works end-to-end offline.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WORKERS, getWorker } from '../data/workers';
import { SAMPLE_BOOKINGS } from '../data/bookings';
import { reviewsForWorker } from '../data/reviews';
import { id } from '../utils/format';

const STORAGE_KEYS = {
  bookings: 'ss_bookings_v1',
  chats: 'ss_chats_v1',
};

let bookings = [...SAMPLE_BOOKINGS];
let chats = {};

// ---- persistence (best-effort) ----
async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
  } catch (e) {
    // storage unavailable in some environments — fine for demo
  }
}

async function load() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.bookings);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Rehydrate default bookings if storage is empty/older than demo set
      if (parsed.length > 0) bookings = [...parsed, ...SAMPLE_BOOKINGS.filter((b) => !parsed.some((p) => p.id === b.id))];
      else bookings = [...SAMPLE_BOOKINGS];
    }
  } catch (e) {
    bookings = [...SAMPLE_BOOKINGS];
  }
}

load();

// ---- workers (read-only in demo) ----
export const api = {
  // workers
  listWorkers() {
    return [...WORKERS];
  },
  getWorker(id) {
    return getWorker(id);
  },
  reviewsForWorker(id) {
    return reviewsForWorker(id);
  },

  // bookings
  async listBookings() {
    return [...bookings];
  },
  async createBooking({ customerId, customerName, workerId, service, date, time, amount, issue, address }) {
    const b = {
      id: id('b'),
      customerId,
      customerName,
      workerId,
      service,
      date,
      time,
      amount,
      status: 'requested',
      payment: 'pending',
      issue,
      address,
      rating: null,
      review: null,
      coopFee: Math.round(amount * 0.08),
      createdAt: new Date().toISOString(),
    };
    bookings = [b, ...bookings];
    await persist();
    return b;
  },
  async updateBooking(bookingId, patch) {
    bookings = bookings.map((b) => (b.id === bookingId ? { ...b, ...patch } : b));
    await persist();
    return bookings.find((b) => b.id === bookingId);
  },
  async cancelBooking(bookingId) {
    return api.updateBooking(bookingId, { status: 'cancelled' });
  },

  // chat
  async listConversations(userId) {
    return Object.values(chats).filter((c) => c.participants.includes(userId));
  },
  async getConversation(customerId, workerId) {
    const key = [customerId, workerId].sort().join('_');
    if (!chats[key]) {
      chats[key] = { id: key, participants: [customerId, workerId], messages: [] };
    }
    return chats[key];
  },
  async sendMessage(convId, senderId, text) {
    const conv = chats[convId];
    if (!conv) return null;
    const msg = { id: id('m'), senderId, text, time: new Date().toISOString() };
    conv.messages = [...conv.messages, msg];
    await AsyncStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chats)).catch(() => {});
    return msg;
  },

  // notifications (demo: derived from bookings)
  notificationsFor(userId, role) {
    const relevant = bookings.filter((b) =>
      role === 'customer' ? b.customerId === userId : b.workerId === userId
    );
    return relevant
      .map((b) => ({
        id: b.id,
        title:
          b.status === 'requested'
            ? 'New booking request'
            : b.status === 'confirmed'
            ? 'Booking confirmed'
            : b.status === 'completed'
            ? 'Service completed'
            : b.status === 'cancelled'
            ? 'Booking cancelled'
            : 'Service started',
        body: `${b.service} • ${b.date} ${b.time}`,
        time: b.createdAt,
      }))
      .slice(0, 8);
  },
};

export const resetDemo = async () => {
  bookings = [...SAMPLE_BOOKINGS];
  chats = {};
  await AsyncStorage.removeItem(STORAGE_KEYS.bookings).catch(() => {});
  await AsyncStorage.removeItem(STORAGE_KEYS.chats).catch(() => {});
};
