import { create } from 'zustand';
import { api } from '../services/mockApi';

export const useBookingStore = create((set, get) => ({
  bookings: [],

  async loadBookings() {
    const bookings = await api.listBookings();
    set({ bookings });
  },

  async createBooking(payload) {
    const b = await api.createBooking(payload);
    set({ bookings: [b, ...get().bookings] });
    return b;
  },

  async setStatus(bookingId, status) {
    const b = await api.updateBooking(bookingId, { status });
    set({ bookings: get().bookings.map((x) => (x.id === bookingId ? b : x)) });
  },

  async setPayment(bookingId, method) {
    const b = await api.updateBooking(bookingId, { payment: 'paid', paymentMethod: method });
    set({ bookings: get().bookings.map((x) => (x.id === bookingId ? b : x)) });
  },

  async addReview(bookingId, rating, review) {
    const b = await api.updateBooking(bookingId, { rating, review, reviewed: true });
    set({ bookings: get().bookings.map((x) => (x.id === bookingId ? b : x)) });
  },

  async cancelBooking(bookingId) {
    await api.cancelBooking(bookingId);
    set({ bookings: get().bookings.filter((x) => x.id !== bookingId) });
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