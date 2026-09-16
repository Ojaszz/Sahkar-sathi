import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Card, CoopCallout } from '../../src/components/ui';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { formatINR, formatDate } from '../../src/utils/format';
import { getService } from '../../src/data/services';
import { t } from '../../src/i18n';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function WorkerEarnings() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const user = useAuthStore((s) => s.user);
  const { bookings, loadBookings } = useBookingStore();

  useEffect(() => {
    loadBookings();
  }, []);

  const workerId = user?.id || 'w1';
  const my = useMemo(() => bookings.filter((b) => b.workerId === workerId), [bookings, workerId]);
  const completed = my.filter((b) => b.status === 'completed');
  const paid = completed.filter((b) => b.payment === 'paid');

  const monthTotal = completed.reduce((s, b) => s + b.amount, 0);
  const coopShare = completed.reduce((s, b) => s + b.coopFee, 0);
  const net = monthTotal - coopShare;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('workerApp.earnings')}</Text>
      </View>

      {/* Big earnings card */}
      <View style={styles.metricCard}>
        <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>{t('workerApp.month')}</Text>
        <Text style={[typography.display, { color: colors.white }]}>{formatINR(monthTotal)}</Text>
        <View style={styles.metricRow}>
          <MiniStat label={t('workerApp.jobsDone')} value={completed.length} />
          <MiniStat label={t('workerApp.averageBookingValue')} value={completed.length ? formatINR(Math.round(monthTotal / Math.max(completed.length, 1))) : '—'} />
        </View>
      </View>

      <View style={styles.feeRow}>
        <Card style={styles.feeCard}>
          <Text style={[typography.small, { color: colors.textMuted }]}>{t('workerApp.cooperativeFee')}</Text>
          <Text style={[typography.h3, { color: colors.accent }]}>− {formatINR(coopShare)}</Text>
        </Card>
        <Card style={styles.feeCard}>
          <Text style={[typography.small, { color: colors.textMuted }]}>{t('workerApp.totalEarnings')} ({t('workerApp.net')})</Text>
          <Text style={[typography.h3, { color: colors.text }]}>{formatINR(net)}</Text>
        </Card>
      </View>

      <CoopCallout
        style={{ marginBottom: spacing.lg }}
        icon="shield-check"
        title={t('workerApp.coopContribution')}
        note={t('workerApp.coopContributionNote')}
      />

      {/* Payout history */}
      <Text style={[typography.h3, styles.historyTitle]}>{t('workerApp.payoutHistory')}</Text>
      {completed.length === 0 ? (
        <Text style={[typography.caption, { color: colors.textMuted }]}>{t('workerApp.noPayouts')}</Text>
      ) : (
        completed.map((b) => {
          const service = getService(b.service);
          return (
            <View key={b.id} style={styles.payout}>
              <View style={[styles.payoutIcon, { backgroundColor: `${service.color}22` }]}>
                <MaterialCommunityIcons name={service.icon} size={18} color={service.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{t(`categories.${b.service}`)}</Text>
                <Text style={[typography.small, { color: colors.textMuted }]}>
                  {formatDate(b.date)} • {b.payment === 'paid' ? '✓ ' + t('bookings.paid') : t('bookings.payPending', { amount: 0 })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{formatINR(b.amount)}</Text>
                <Text style={[typography.small, { color: colors.success }]}>{t('workerApp.net')} {formatINR(b.amount - b.coopFee)}</Text>
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

function MiniStat({ label, value }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.miniStat}>
      <Text style={[typography.h3, { color: colors.white }]}>{value}</Text>
      <Text style={[typography.small, { color: 'rgba(255,255,255,0.8)' }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { marginTop: spacing.md, marginBottom: spacing.lg },
  metricCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: 4,
  },
  metricRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  miniStat: { gap: 2 },
  feeRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  feeCard: { flex: 1, gap: 2 },
  historyTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  payout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  payoutIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
