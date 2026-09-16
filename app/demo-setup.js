import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Card, CoopCallout } from '../src/components/ui';
import Avatar from '../src/components/ui/Avatar';
import { colors, radius, spacing, typography } from '../src/theme';
import { WORKERS, workerArea } from '../src/data/workers';
import { getService } from '../src/data/services';
import { useAuthStore } from '../src/store/authStore';
import { useSyncStore } from '../src/store/syncStore';
import { deviceId } from '../src/lib/supabase';
import { resetDemo } from '../src/utils/resetDemo';
import { useSettingsStore } from '../src/store/settingsStore';
import { t } from '../src/i18n';

// Which static worker profiles are offered as live "players" — the five members.
const WORKER_PICK_IDS = ['w1', 'w2', 'w3', 'w4', 'w5'];

export default function DemoSetupScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const players = WORKER_PICK_IDS.map((id) => WORKERS.find((w) => w.id === id)).filter(Boolean);

  const pickCustomer = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const id = await deviceId();
      await useAuthStore.getState().login({
        id,
        name: 'Ojas',
        phone: '+91 98765 43210',
        role: 'customer',
        email: 'ojas@example.com',
        location: 'FC Road, Pune',
        avatar: '👨',
        isDemo: true,
      });
      useSyncStore.getState().init();
      router.replace('/(customer)');
    } catch (e) {
      Alert.alert(t('demoSetup.setupFailed'), String((e && e.message) || e));
    } finally {
      setBusy(false);
    }
  };

  const pickWorker = async (w) => {
    if (busy) return;
    setBusy(true);
    try {
      await useAuthStore.getState().login({
        id: w.id,
        name: w.name,
        phone: '+91 9' + Math.floor(100000000 + Math.random() * 899999999),
        role: 'worker',
        email: `${w.id}@coop.in`,
        location: workerArea(w.id),
        avatar: w.avatar,
        service: w.service,
        isDemo: true,
      });
      useSyncStore.getState().init();
      router.replace('/(worker)');
    } catch (e) {
      Alert.alert(t('demoSetup.setupFailed'), String((e && e.message) || e));
    } finally {
      setBusy(false);
    }
  };

  // "Start everything fresh" — wipe this phone (and optionally the shared board)
  // then land back on login.
  const doReset = (board) => {
    Alert.alert(
      t('demoSetup.startFreshTitle'),
      board
        ? t('demoSetup.clearConfirmBoard')
        : t('demoSetup.clearConfirmPhone'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('demoSetup.reset'),
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await resetDemo({ board });
              router.replace('/auth/login');
            } catch (e) {
              Alert.alert(t('demoSetup.resetFailed'), String((e && e.message) || e));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('demoSetup.title')}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('demoSetup.subtitle')}
        </Text>
      </View>

      <Text style={[typography.h3, { color: colors.text }]}>{t('demoSetup.customerPhone')}</Text>
      <Card style={styles.playerCard}>
        <Avatar emoji="👨" size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={typography.bodyBold}>{t('demoSetup.customerName')}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>
            {t('demoSetup.customerDesc')}
          </Text>
        </View>
        <Button title={t('demoSetup.useThisPhone')} size="sm" onPress={pickCustomer} disabled={busy} />
      </Card>

      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.lg }]}>
        {t('demoSetup.workerPhones')}
      </Text>
      {players.map((w) => {
        const svc = getService(w.service);
        return (
          <Card key={w.id} style={styles.playerCard}>
            <Avatar emoji={w.avatar} size={48} online={w.available} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={typography.bodyBold}>{w.name}</Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>
                {svc ? svc.name : w.service} • {w.rating}★
              </Text>
            </View>
            <Button title={t('demoSetup.thisIsMe')} size="sm" variant="outline" onPress={() => pickWorker(w)} disabled={busy} />
          </Card>
        );
      })}

      <Text style={[typography.h3, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md }]}>
        {t('demoSetup.startFresh')}
      </Text>
      <View style={styles.resetRow}>
        <Button title={t('demoSetup.clearThisPhone')} size="sm" variant="outline" style={{ flex: 1 }} onPress={() => doReset(false)} disabled={busy} />
        <Button title={t('demoSetup.clearPhoneBoard')} size="sm" variant="dangerOutline" style={{ flex: 1 }} onPress={() => doReset(true)} disabled={busy} />
      </View>

      <CoopCallout
        style={{ marginTop: spacing.xl }}
        icon="cellphone-link"
        title={t('demoSetup.howItWorks')}
        note={t('demoSetup.howItWorksNote')}
      />
    </Screen>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    header: { marginTop: spacing.md, marginBottom: spacing.lg, gap: 6 },
    resetRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    playerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
  });