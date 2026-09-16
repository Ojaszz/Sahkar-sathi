import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, layout } from '../../src/theme';
import { t } from '../../src/i18n';

const ICONS = {
  index: 'view-dashboard',
  jobs: 'briefcase-check',
  earnings: 'cash-multiple',
  chat: 'chat-processing',
  profile: 'account',
};

export default function WorkerLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2E7BB0',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: layout.tabBarHeight + 8, paddingBottom: 8, backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => (
          <MaterialCommunityIcons
            name={ICONS[route.name] || 'view-dashboard'}
            size={size}
            color={focused ? '#2E7BB0' : color}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('workerApp.dashboard') }} />
      <Tabs.Screen name="jobs" options={{ title: t('workerApp.jobs') }} />
      <Tabs.Screen name="earnings" options={{ title: t('workerApp.earnings') }} />
      <Tabs.Screen name="chat" options={{ title: t('chat.title') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile.title') }} />
    </Tabs>
  );
}