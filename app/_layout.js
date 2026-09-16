// Root layout — providers + auth gate
import React, { useEffect, useLayoutEffect, useReducer } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, Redirect, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { useDeclineStore } from '../src/store/declineStore';
import { colors, typography, applyColorScheme } from '../src/theme';

function SplashScreen() {
  const styles = makeStyles(colors);
  return (
    <View style={styles.splash}>
      <View style={styles.logoWrap}>
        <MaterialCommunityIcons name="handshake" size={48} color={colors.white} />
      </View>
      <Text style={[typography.h1, styles.title]}>सहकार साथी</Text>
      <Text style={[typography.h1, styles.titleEn]}>Sahkar Sathi</Text>
      <Text style={styles.sub}>Cooperative services for your home & community</Text>
    </View>
  );
}

function Gate({ children }) {
  const styles = makeStyles(colors);
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();

  if (loading) return <SplashScreen />;

  const isAuthRoute = segments[0] === 'auth';
  const isIndexRoute = segments[0] === 'index';

  // Always keep the navigator mounted. Redirecting in place of it causes Expo
  // Router to repeatedly mount and redirect the same route.
  if (!isAuthenticated) {
    return (
      <>
        {children}
        {!isAuthRoute ? <Redirect href="/auth/login" /> : null}
      </>
    );
  }

  const target = user?.role === 'worker' ? '/(worker)' : user?.role === 'admin' ? '/(admin)' : '/(customer)';
  return (
    <>
      {children}
      {isAuthRoute || isIndexRoute || segments.length === 0 ? <Redirect href={target} /> : null}
    </>
  );
}

export default function RootLayout() {
  const styles = makeStyles(colors);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const restoreSettings = useSettingsStore((s) => s.restore);
  const restoreDeclined = useDeclineStore((s) => s.restore);
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    restoreSession();
    restoreSettings();
    restoreDeclined();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {/* ThemeGate swaps the palette in place and forces one re-render WITHOUT
          unmounting — so scroll position, keyboard, and the screen stack all
          survive a dark/light toggle (the old `key={theme}` remount snapped
          the screen back to the top). */}
      <ThemeGate theme={theme}>
        <Gate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(worker)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="worker/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="booking/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="booking/[id]" />
            <Stack.Screen name="payment" options={{ presentation: 'modal' }} />
            <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
            <Stack.Screen name="demo-setup" options={{ presentation: 'modal' }} />
            <Stack.Screen name="worker-onboarding" options={{ presentation: 'modal' }} />
            <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="track/[id]" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
        </Gate>
      </ThemeGate>
    </SafeAreaProvider>
  );
}

// Mutates the colors singleton THEN forces a re-render, so every makeStyles(colors)
// child re-snapshots the new palette — without a key-based remount.
function ThemeGate({ theme, children }) {
  const [, bump] = useReducer((x) => x + 1, 0);
  useLayoutEffect(() => {
    applyColorScheme(theme);
    bump(); // re-render children against the (now mutated) palette
  }, [theme]);
  return <View style={{ flex: 1 }}>{children}</View>;
}

const makeStyles = (colors) => StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 4,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { color: colors.white, fontSize: 26 },
  titleEn: { color: colors.white, fontSize: 26, marginTop: -6 },
  sub: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8 },
});
