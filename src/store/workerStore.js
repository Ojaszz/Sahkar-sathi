import { create } from 'zustand';
import { WORKERS, getWorker } from '../data/workers';
import { useWorkerDirectoryStore } from './workerDirectoryStore';

export const useWorkerStore = create((set, get) => ({
  workers: WORKERS,
  query: '',
  activeCategory: null,
  sortBy: 'rating', // rating | distance | price
  minRating: 0,
  onlyAvailable: false,

  setQuery: (query) => set({ query }),
  setCategory: (category) => set({ activeCategory: category, query: '' }),
  setSortBy: (sortBy) => set({ sortBy }),
  setMinRating: (minRating) => set({ minRating }),
  setOnlyAvailable: (onlyAvailable) => set({ onlyAvailable }),
  clearFilters: () => set({ query: '', activeCategory: null, sortBy: 'rating', minRating: 0, onlyAvailable: false }),

  // filtered + sorted view. Static catalogue first, then any REGISTERED workers
  // (email-signup + onboarding) published to the worker_profiles board.
  visibleWorkers() {
    const { query, activeCategory, sortBy, minRating, onlyAvailable } = get();
    const registered = useWorkerDirectoryStore.getState().profiles;
    let list = [...WORKERS, ...registered];
    if (activeCategory) list = list.filter((w) => w.service === activeCategory);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (w) =>
          (w.name || '').toLowerCase().includes(q) ||
          (w.service || '').toLowerCase().includes(q) ||
          (w.skills || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    if (minRating > 0) list = list.filter((w) => w.rating >= minRating);
    if (onlyAvailable) list = list.filter((w) => w.available);

    switch (sortBy) {
      case 'distance':
        list.sort((a, b) => a.distance - b.distance);
        break;
      case 'price':
        list.sort((a, b) => a.price - b.price);
        break;
      default:
        list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  },

  // Resolve a worker id against BOTH halves — registered profiles first (a
  // registered worker must never fall back to the catalogue), then the catalogue.
  getWorker: (id) => {
    const dir = useWorkerDirectoryStore.getState().byId[id];
    if (dir) return dir;
    return getWorker(id);
  },

  // True when the id is an email-registered worker (not a catalogue face).
  isRegistered: (id) => !!useWorkerDirectoryStore.getState().byId[id],
}));