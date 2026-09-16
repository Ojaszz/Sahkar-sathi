import { create } from 'zustand';
import { api } from '../services/mockApi';

export const useNotificationsStore = create((set) => ({
  items: [],
  refresh: (userId, role) => {
    set({ items: api.notificationsFor(userId, role) });
  },
}));