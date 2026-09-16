import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage } from '../i18n';
import { applyColorScheme } from '../theme';

const KEY = 'ss_settings_v1';

export const useSettingsStore = create((set, get) => ({
  language: 'en',
  notificationsEnabled: true,
  theme: 'light',

  restore: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setLanguage(s.language || 'en');
        if (s.theme) applyColorScheme(s.theme);
        set(s);
      }
    } catch (e) {
      // ignore
    }
  },

  setLanguage: async (lang) => {
    setLanguage(lang);
    set({ language: lang });
    const current = get();
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({
        language: lang,
        notificationsEnabled: current.notificationsEnabled,
        theme: current.theme,
      })
    );
  },

  toggleNotifications: async () => {
    const next = !get().notificationsEnabled;
    set({ notificationsEnabled: next });
    const { language, theme } = get();
    await AsyncStorage.setItem(KEY, JSON.stringify({ language, notificationsEnabled: next, theme }));
  },

  setTheme: async (theme) => {
    applyColorScheme(theme);
    set({ theme });
    const { language, notificationsEnabled } = get();
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ language, notificationsEnabled, theme })
    );
  },
}));