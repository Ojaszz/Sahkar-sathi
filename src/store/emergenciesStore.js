// Emergency-job store — drives the call-style ringing overlay on worker phones.
//
// Customer phone: publishes via publishEmergency(), then watches acceptedEmergency
// to show "Worker accepted!" feedback.
//
// Worker phone: syncStore merges polled rows into this store; the first
// active emergency the worker hasn't dismissed triggers the overlay.
// Accept creates a real booking (with +20 % pay) so the normal job flow takes
// over; Reject appends the worker to rejected_by so the overlay stops for them.

import { create } from 'zustand';
import { supabase, newEmergencyId, newBookingId } from '../lib/supabase';
import { useBookingStore } from './bookingStore';
import { useAuthStore } from './authStore';
import { COOP_FEE_PERCENT, EMERGENCY_PAY_MULTIPLIER } from '../utils/constants';

export const useEmergenciesStore = create((set, get) => ({
  emergencies: [],
  visibleEmergency: null,    // active emergency shown in the worker overlay
  acceptedEmergency: null,   // emergency accepted by this worker (customer side)
  overlayDismissed: new Set(), // IDs this worker already dismissed/rejected

  // Called by syncStore after each poll.
  mergeRemote(rows) {
    const myId = useAuthStore.getState().user?.id;
    const role = useAuthStore.getState().user?.role;
    const dismissed = get().overlayDismissed;

    set({ emergencies: rows });

    // Worker phone: first active emergency I haven't dismissed and didn't create.
    const isWorker = role === 'worker';
    const visible = isWorker
      ? rows.find(
          (e) =>
            e.status === 'active' &&
            e.customer_id !== myId &&
            !(e.rejected_by || []).includes(myId) &&
            !dismissed.has(e.id)
        ) || null
      : null;

    // Customer phone: the emergency I raised that got accepted → show feedback.
    const isCustomer = role === 'customer' || !role;
    const accepted = isCustomer
      ? rows.find(
          (e) => e.customer_id === myId && e.status === 'accepted'
        ) || null
      : null;

    // Also detect accepted emergencies where I'm the worker (for customer UI).
    const workerAccepted = isWorker
      ? rows.find((e) => e.worker_id === myId && e.status === 'accepted')
      : null;

    set({
      visibleEmergency: visible,
      acceptedEmergency: accepted || workerAccepted,
    });
  },

  // ── Customer side ────────────────────────────────────────────────────────
  async publishEmergency({ customerId, customerName, problem, location, lat, lng, amount }) {
    const id = newEmergencyId();
    const row = await supabase.insert('emergencies', {
      id,
      customer_id: customerId,
      customer_name: customerName || 'Customer',
      problem,
      location: location || '',
      lat: lat || null,
      lng: lng || null,
      amount: amount || 500,
      pay_multiplier: EMERGENCY_PAY_MULTIPLIER,
      status: 'active',
    });
    return row?.[0] || null;
  },

  // ── Worker side ──────────────────────────────────────────────────────────
  async acceptEmergency(emergencyId, workerId, workerName) {
    try {
      // Atomic accept: only succeeds if still 'active' (first tap wins).
      const rows = await supabase.patch(
        'emergencies',
        { id: `eq.${emergencyId}`, status: 'eq.active' },
        { status: 'accepted', worker_id: workerId, worker_name: workerName }
      );
      const emergency = rows?.[0];
      if (!emergency) return { ok: false, error: 'Too slow — another worker accepted first.' };

      // Create a real booking so the normal job / payment flow takes over.
      const emergencyAmount = Math.round((emergency.amount || 500) * EMERGENCY_PAY_MULTIPLIER);
      const coopFee = Math.round(emergencyAmount * (COOP_FEE_PERCENT / 100));
      const bookingId = newBookingId();
      const booking = await supabase.insert('bookings', {
        id: bookingId,
        service: 'emergency',
        customer_id: emergency.customer_id,
        customer_name: emergency.customer_name,
        worker_id: workerId,
        worker_name: workerName,
        status: 'confirmed',
        address: emergency.location || 'Emergency location',
        issue: `🚨 EMERGENCY — ${emergency.problem}`,
        amount: emergencyAmount,
        coop_fee: coopFee,
      });

      // Merge into the local booking store so the job appears in Upcoming immediately.
      if (booking?.[0]) {
        const b = booking[0];
        useBookingStore.getState().mergeRemote({
          id: String(b.id),
          service: b.service,
          workerId: b.worker_id,
          workerName: b.worker_name,
          customerId: b.customer_id,
          customerName: b.customer_name,
          status: b.status,
          address: b.address,
          issue: b.issue,
          amount: b.amount,
          coopFee: b.coop_fee,
          date: (b.created_at || '').slice(0, 10),
          time: 'ASAP',
          payment: b.payment || 'unpaid',
          paymentMethod: null,
          rating: null,
          reviewed: false,
          isLive: true,
        });
      }

      // Dismiss overlay for this worker.
      const dismissed = new Set(get().overlayDismissed);
      dismissed.add(emergencyId);
      set({ visibleEmergency: null, overlayDismissed: dismissed });

      return { ok: true, bookingId };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async rejectEmergency(emergencyId, workerId) {
    // Immediately hide overlay for this worker.
    const dismissed = new Set(get().overlayDismissed);
    dismissed.add(emergencyId);
    set({ visibleEmergency: null, overlayDismissed: dismissed });

    // Best-effort: append to rejected_by so the overlay doesn't reappear.
    try {
      const current = get().emergencies.find((e) => e.id === emergencyId);
      const rejectedBy = [...new Set([...(current?.rejected_by || []), workerId])];
      await supabase.patch('emergencies', { id: `eq.${emergencyId}` }, { rejected_by: rejectedBy });
    } catch {}
  },

  // Customer clears the "worker accepted" banner.
  clearAcceptedEmergency() {
    set({ acceptedEmergency: null });
  },

  reset() {
    set({ emergencies: [], visibleEmergency: null, acceptedEmergency: null, overlayDismissed: new Set() });
  },
}));
