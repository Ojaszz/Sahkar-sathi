// Notifications derived from the LIVE booking store + chat messages.
// Instead of reading from mockApi, we derive notifications in real time from the
// bookingStore (which syncStore keeps up-to-date via Supabase polling every ~1.5 s).
// This means when a worker accepts a booking on another phone, the customer sees
// a "Booking confirmed" notification within one poll cycle.

import { create } from 'zustand';
import { useBookingStore } from './bookingStore';
import { useAuthStore } from './authStore';
import { useTagAlongStore } from './tagAlongStore';

// Status → notification title + icon
const STATUS_MAP = {
  requested:  { titleKey: 'notifications.newRequest',   icon: 'bell-ring-outline' },
  confirmed:  { titleKey: 'notifications.confirmed',     icon: 'check-decagram-outline' },
  inProgress: { titleKey: 'notifications.inProgress',    icon: 'progress-wrench' },
  completed:  { titleKey: 'notifications.completed',     icon: 'check-circle-outline' },
  cancelled:  { titleKey: 'notifications.cancelled',     icon: 'close-circle-outline' },
};

export const useNotificationsStore = create((set, get) => ({
  items: [],
  readIds: {},     // { [bookingId]: true }
  unreadCount: 0,
  lastSig: '',

  // Derive notifications from the live booking store.
  // Called whenever the screen renders (the screen subscribes to `items`).
  refresh(userId, role) {
    const myId = useAuthStore.getState().user?.id || userId;
    const bookings = useBookingStore.getState().bookings;

    const notifications = [];

    for (const b of bookings) {
      const isCustomer = b.customerId === myId || b.customerId === userId;
      const isWorker = b.workerId === myId || b.workerId === userId;
      if (!isCustomer && !isWorker) continue;

      const map = STATUS_MAP[b.status];
      if (!map) continue;

      const partnerName = isWorker ? b.customerName : (b.workerName || 'Worker');
      const service = b.service || 'service';

      // Emergency SOS → a louder, siren-marked notification at the moment of
      // acceptance (later status changes show the normal titles).
      const isEmergencyAccept = b.service === 'emergency' && b.status === 'confirmed';

      notifications.push({
        id: b.id,
        title: isEmergencyAccept ? 'notifications.emergencyAccepted' : map.titleKey,
        body: `${partnerName} • ${service}`,
        time: b.date || b.createdAt || '',
        icon: isEmergencyAccept ? 'alarm-light' : map.icon,
        bookingId: b.id,
        status: b.status,
      });

      // Payment notification for the customer
      if (b.payment === 'paid' && isCustomer) {
        notifications.push({
          id: `${b.id}-paid`,
          title: 'notifications.payment',
          body: `₹${b.amount} paid via ${b.paymentMethod || 'cash'}`,
          time: b.date || b.createdAt || '',
          icon: 'currency-inr',
          bookingId: b.id,
          status: 'paid',
        });
      }

      // Rating notification for the worker
      if (b.reviewed && b.rating && isWorker) {
        notifications.push({
          id: `${b.id}-rated`,
          title: 'notifications.rated',
          body: `${b.rating}★ rating from ${b.customerName || 'Customer'}`,
          time: b.date || b.createdAt || '',
          icon: 'star-outline',
          bookingId: b.id,
          status: 'rated',
        });
      }
    }

    // Tag-along notifications
    const tagRows = useTagAlongStore.getState().rows;
    for (const t of tagRows) {
      if (t.juniorId === myId) {
        if (t.status === 'accepted') {
          notifications.push({
            id: `tag-${t.id}-accepted`,
            title: 'notifications.tagAccepted',
            body: `${t.mentorName || 'Mentor'} accepted your tag-along request`,
            time: t.time || t.createdAt || '',
            icon: 'account-group-outline',
            bookingId: `tag-${t.id}`,
            status: 'tagAccepted',
          });
        }
        if (t.status === 'completed' && t.rating) {
          notifications.push({
            id: `tag-${t.id}-rated`,
            title: 'notifications.tagShared',
            body: `Shared rating: ${t.rating}★ from mentor's job`,
            time: t.time || t.createdAt || '',
            icon: 'star-shooting-outline',
            bookingId: `tag-${t.id}`,
            status: 'tagShared',
          });
        }
      }
      if (t.mentorId === myId && t.status === 'pending') {
        notifications.push({
          id: `tag-${t.id}-request`,
          title: 'notifications.tagRequest',
          body: `${t.juniorName || 'New member'} wants to tag along with you`,
          time: t.time || t.createdAt || '',
          icon: 'account-plus-outline',
          bookingId: `tag-${t.id}`,
          status: 'tagRequest',
        });
      }
    }

    // Sort by time (most recent first)
    notifications.sort((a, b) => {
      try { return new Date(b.time) - new Date(a.time); } catch { return 0; }
    });

    // Trim to recent 20
    const trimmed = notifications.slice(0, 20);

    // Compute unread count
    const readIds = get().readIds;
    const unread = trimmed.filter((n) => !readIds[n.id]).length;

    // Only write when something actually changed, so refresh() is safe to call
    // from subscriptions/render loops.
    const sig = `${trimmed.map((n) => n.id + ':' + n.status).join('|')}:u${unread}`;
    if (sig === get().lastSig) return;
    set({ items: trimmed, unreadCount: unread, lastSig: sig });
  },

  // Mark a single notification as read
  markRead(notificationId) {
    set((s) => ({
      readIds: { ...s.readIds, [notificationId]: true },
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  // Mark all as read
  markAllRead() {
    const items = get().items;
    const readIds = {};
    items.forEach((n) => { readIds[n.id] = true; });
    set({ readIds, unreadCount: 0 });
  },

  // Reset
  reset() {
    set({ items: [], readIds: {}, unreadCount: 0 });
  },
}));
