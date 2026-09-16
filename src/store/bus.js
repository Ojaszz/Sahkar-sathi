// One-way mediator so bookingStore can delegate cross-device actions to syncStore
// without a circular import. syncStore installs these handlers on init (live mode);
// in mock mode they stay null and bookingStore falls back to the local mock API.

export const liveBus = {
  create: null, // async (payload) => serverBooking
  status: null, // async (bookingId, status) => void
  cancel: null, // async (bookingId) => void
  payment: null, // async (bookingId, method) => void
  review: null, // async (bookingId, rating, review) => void
};