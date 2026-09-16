// Registered worker profiles — the "grow your own" half of the worker directory.
//
// The seeded catalogue (src/data/workers.js, w1…w5) is the static half of the
// customer search. This store holds the OTHER half: workers who registered with an
// email and completed the onboarding wizard. Each one publishes a public row to the
// `worker_profiles` board (see docs/worker-profiles.sql) via authStore, every phone
// polls that board (syncStore), and the customer search merges the two halves so a
// brand-new worker's profile shows up for customers.
//
// A registered profile is converted to the SAME local shape the catalogue uses
// (rating, distance, price, skills, …) so WorkerCard / the detail screen render it
// unchanged — except `isRegistered: true` so screens can badge "new member".

import { create } from 'zustand';
import { distanceKm } from '../utils/geo';
import { USER_LOCATION } from '../utils/constants';

// Server row (worker_profiles) -> local worker shape used by search/detail.
function toLocal(r) {
  const area = Array.isArray(r.service_areas) ? r.service_areas[0] : null;
  const loc = [Number(r.location_lat) || 18.5204, Number(r.location_lng) || 73.8567];
  return {
    id: String(r.id),
    name: r.name || 'New cooperative member',
    avatar: r.avatar || '👨‍🔧',
    service: r.service || 'domestic',
    rating: Number(r.rating) || 0,
    reviewsCount: Number(r.reviews_count) || 0,
    jobsCompleted: Number(r.jobs_completed) || 0,
    price: Number(r.rate) || 250,
    distance: distanceKm(USER_LOCATION, loc),
    available: r.available !== false,
    yearsExp: r.experience_years || '',
    memberSince: Number((r.created_at || '').slice(0, 4)) || new Date().getFullYear(),
    location: loc,
    languages: Array.isArray(r.languages) ? r.languages : [],
    about: `${r.name || 'This worker'} just joined the cooperative — a new verified member ready to help in ${area || 'your area'}.`,
    skills: Array.isArray(r.skills) ? r.skills : [],
    certifications: Array.isArray(r.certifications) ? r.certifications : [],
    insuranceCover: '₹5,00,000 life cover • Accident • Hospitalisation',
    status: 'verified',
    isFairWage: true,
    isRegistered: true,
  };
}

export const useWorkerDirectoryStore = create((set, get) => ({
  profiles: [], // local shapes, one per registered worker
  byId: {}, // id -> local shape (fast lookup for the detail screen)

  mergeRemote(rows) {
    if (!rows || !rows.length) return;
    const next = { ...get().byId };
    for (const r of rows) {
      const local = toLocal(r);
      next[local.id] = { ...next[local.id], ...local };
    }
    set({ byId: next, profiles: Object.values(next) });
  },

  reset() {
    set({ profiles: [], byId: {} });
  },
}));