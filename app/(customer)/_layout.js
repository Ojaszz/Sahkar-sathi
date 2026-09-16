import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, layout } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { t } from '../../src/i18n';

const ICONS = {
  index: 'home-variant',
  search: 'magnify',
  bookings: 'calendar-check',
  chat: 'chat-processing',
  profile: 'account',
};

export default function CustomerLayout() {
  const language = useSettingsStore((s) => s.language);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: layout.tabBarHeight + 8, paddingBottom: 8, backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => (
          <MaterialCommunityIcons
            name={ICONS[route.name] || 'home-variant'}
            size={size}
            color={focused ? colors.primary : color}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('home.title') }} />
      <Tabs.Screen name="search" options={{ title: t('search.title') }} />
      <Tabs.Screen name="bookings" options={{ title: t('bookings.title') }} />
      <Tabs.Screen name="chat" options={{ title: t('chat.title') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile.title') }} />
    </Tabs>
  );
}