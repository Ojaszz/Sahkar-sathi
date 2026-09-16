import { create } from 'zustand';
import { WORKERS, getWorker } from '../data/workers';

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

  // filtered + sorted view
  visibleWorkers() {
    const { workers, query, activeCategory, sortBy, minRating, onlyAvailable } = get();
    let list = [...workers];
    if (activeCategory) list = list.filter((w) => w.service === activeCategory);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.service.toLowerCase().includes(q) ||
          w.skills.some((s) => s.toLowerCase().includes(q))
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

  getWorker: (id) => getWorker(id),
}));