import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, layout } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { isKnownWorker } from '../../src/data/workers';
import { t } from '../../src/i18n';
import EmergencyCallOverlay from '../../src/components/worker/EmergencyCallOverlay';

const ICONS = {
  index: 'view-dashboard',
  jobs: 'briefcase-check',
  earnings: 'cash-multiple',
  chat: 'chat-processing',
  profile: 'account',
};

export default function WorkerLayout() {
  useSettingsStore((s) => s.theme); // re-render tab bar on theme toggle
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Forced-once onboarding gate: a worker who registered with email (uuid id, not
  // in the demo catalogue) has no service/skills/area yet — complete the profile
  // before the dashboard. Demo/catalogue workers are known → never gated.
  useEffect(() => {
    if (user?.role === 'worker' && !user.onboarded && !isKnownWorker(user.id)) {
      router.replace('/worker-onboarding');
    }
  }, [user?.id, user?.onboarded, user?.role]);

  return (
    <View style={{ flex: 1 }}>
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
      {/* Reachable via router.push only — not a bottom tab */}
      <Tabs.Screen name="tagalong" options={{ href: null }} />
    </Tabs>
    <EmergencyCallOverlay />
    </View>
  );
}