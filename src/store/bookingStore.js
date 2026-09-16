import { create } from 'zustand';
import { api } from '../services/mockApi';
import { liveBus } from './bus';

export const useBookingStore = create((set, get) => ({
  bookings: [],

  async loadBookings() {
    const apiBookings = await api.listBookings();
    // Merge with existing store instead of replacing — live bookings
    // (from publishBooking / sync poll) already in the store are preserved.
    const existing = get().bookings;
    const merged = [...apiBookings];
    for (const b of existing) {
      if (b.isLive && !merged.some((m) => m.id === b.id)) {
        merged.unshift(b);
      }
    }
    set({ bookings: merged });
  },

  async createBooking(payload) {
    // Live mode: the booking is created on Supabase so all worker phones see it.
    if (liveBus.create) {
      const b = await liveBus.create(payload);
      // publishBooking already merges the returned row for an instant customer
      // update. Merge idempotently here too, rather than prepending it again:
      // duplicate ids cause FlatList's duplicate-key render error.
      if (b) get().mergeRemote(b);
      return b;
    }
    const b = await api.createBooking(payload);
    set({ bookings: [b, ...get().bookings] });
    return b;
  },

  async setStatus(bookingId, status) {
    // Live mode: persist to Supabase AND merge the confirmed row locally.
    if (liveBus.status) {
      await liveBus.status(bookingId, status);
      return;
    }
    const b = await api.updateBooking(bookingId, { status });
    set({ bookings: get().bookings.map((x) => (x.id === bookingId ? b : x)) });
  },

  async setPayment(bookingId, method) {
    if (liveBus.payment) {
      await liveBus.payment(bookingId, method);
      return;
    }
    const b = await api.updateBooking(bookingId, { payment: 'paid', paymentMethod: method });
    set({ bookings: get().bookings.map((x) => (x.id === bookingId ? b : x)) });
  },

  async addReview(bookingId, rating, review) {
    if (liveBus.review) {
      await liveBus.review(bookingId, rating, review);
      return;
    }
    const b = await api.updateBooking(bookingId, { rating, review, reviewed: true });
    set({ bookings: get().bookings.map((x) => (x.id === bookingId ? b : x)) });
  },

  async cancelBooking(bookingId) {
    if (liveBus.cancel) {
      await liveBus.cancel(bookingId);
      return;
    }
    await api.cancelBooking(bookingId);
    set({ bookings: get().bookings.filter((x) => x.id !== bookingId) });
  },

  // Upsert a row that arrived from Supabase (cross-device changes).
  mergeRemote(booking) {
    const exists = get().bookings.some((x) => x.id === booking.id);
    set({
      bookings: exists
        ? get().bookings.map((x) => (x.id === booking.id ? booking : x))
        : [booking, ...get().bookings],
    });
  },

  getById(bookingId) {
    return get().bookings.find((b) => b.id === bookingId) || null;
  },

  // per-role filtered views (must be called under a reactive selector)
  forCustomer(customerId) {
    return get().bookings.filter((b) => b.customerId === customerId);
  },
  forWorker(workerId) {
    return get().bookings.filter((b) => b.workerId === workerId);
  },
}));
