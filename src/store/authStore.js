import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_USERS } from '../utils/constants';
import { useTrackingStore } from './trackingStore';

const KEY = 'ss_auth_v1';

export const useAuthStore = create((set, get) => ({
  user: null, // { id, name, phone, role, email, location, avatar }
  isAuthenticated: false,
  hasVisited: false,
  loading: true,

  markVisited: () => {
    set({ hasVisited: true });
    AsyncStorage.setItem('ss_visited_v1', 'true').catch(() => {});
  },

  restoreSession: async () => {
    try {
      const [stored, visited] = await Promise.all([
        AsyncStorage.getItem(KEY),
        AsyncStorage.getItem('ss_visited_v1'),
      ]);
      if (stored) {
        const user = JSON.parse(stored);
        set({ user, isAuthenticated: true, hasVisited: visited === 'true', loading: false });
        return;
      }
      set({ hasVisited: visited === 'true', loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  login: async (user) => {
    set({ user, isAuthenticated: true });
    await AsyncStorage.setItem(KEY, JSON.stringify(user));
  },

  loginAsDemo: async (role) => {
    const user = DEMO_USERS[role];
    await get().login(user);
    return user;
  },

  updateProfile: async (patch) => {
    const next = { ...get().user, ...patch };
    set({ user: next });
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  },

  logout: async () => {
    useTrackingStore.getState().resetAll(); // stop any live tracking sims
    await AsyncStorage.removeItem(KEY);
    set({ user: null, isAuthenticated: false });
  },
}));