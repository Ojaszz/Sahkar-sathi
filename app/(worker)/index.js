import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Card, SectionHeader, CoopCallout, Badge } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { BookingCard } from '../../src/components/booking';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useBookingStore } from '../../src/store/bookingStore';
import { useNotificationsStore } from '../../src/store/notificationsStore';
import { formatINR } from '../../src/utils/format';
import { t } from '../../src/i18n';

export default function WorkerDashboard() {
  const styles = makeStyles(colors);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { bookings, loadBookings } = useBookingStore();
  const items = useNotificationsStore((s) => s.items);
  const refreshNotifs = useNotificationsStore((s) => s.refresh);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    loadBookings();
    refreshNotifs(user?.id, user?.role);
  }, []);

  const workerId = user?.id || 'w1';
  const myBookings = bookings.filter((b) => b.workerId === workerId);
  const requests = myBookings.filter((b) => b.status === 'requested');
  const today = myBookings.filter((b) => ['confirmed', 'inProgress'].includes(b.status));
  const completed = myBookings.filter((b) => b.status === 'completed');
  const monthEarnings = completed.reduce((s, b) => s + b.amount, 0);

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[typography.captionMedium, { color: colors.textMuted }]}>Welcome back,</Text>
          <Text style={[typography.h2, { color: colors.text }]}>
            {user?.name?.split(' ')[0]} {user?.role === 'worker' ? '🔧' : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.notifBtn} hitSlop={8}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
            {items.length > 0 ? <View style={styles.notifDot} /> : null}
          </Pressable>
          <Pressable style={styles.onlineToggle} onPress={() => setAvailable(!available)}>
            <View style={[styles.onlineDot, { backgroundColor: available ? colors.success : colors.textMuted }]} />
            <Text style={[typography.captionMedium, { color: available ? colors.success : colors.textMuted }]}>
              {available ? t('workerApp.available') : t('workerApp.busy')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* New requests banner */}
      {requests.length > 0 ? (
        <Pressable style={styles.alert} onPress={() => router.push('/(worker)/jobs')}>
          <MaterialCommunityIcons name="bell-ring" size={22} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyBold, { color: colors.white }]}>
              {requests.length} {t('workerApp.jobRequests')}
            </Text>
            <Text style={[typography.small, { color: 'rgba(255,255,255,0.85)' }]}>
              Tap to review and accept
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.white} />
        </Pressable>
      ) : null}

      {/* Earnings summary */}
      <SectionHeader title={t('workerApp.earningSummary')} style={styles.section} />
      <View style={styles.earnRow}>
        <EarnCard label={t('workerApp.month')} value={formatINR(monthEarnings)} />
        <EarnCard label={t('workerApp.jobsDone')} value={completed.length} />
        <EarnCard label={t('workerApp.avgRating')} value="4.8★" />
      </View>

      {/* Today's schedule */}
      <SectionHeader
        title={t('workerApp.todaySchedule')}
        action={t('common.seeAll')}
        onAction={() => router.push('/(worker)/jobs')}
        style={styles.section}
      />
      {today.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{t('workerApp.noJobs')}</Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>{t('workerApp.noJobsNote')}</Text>
        </Card>
      ) : (
        today.slice(0, 2).map((b) => <BookingCard key={b.id} booking={b} />)
      )}

      {/* Cooperative values */}
      <SectionHeader title={t('workerApp.cooperativeFee')} style={styles.section} />
      <CoopCallout
        icon="hand-coin"
        title={t('onboard.fairWages')}
        note={t('workerApp.coopNote')}
      />
      <Card style={styles.insuranceCard}>
        <View style={styles.insuranceRow}>
          <MaterialCommunityIcons name="shield-heart" size={26} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold}>{t('profile.insurance')}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              ₹5,00,000 life cover • Accident • Hospitalisation
            </Text>
          </View>
          <Badge label="Active" color={colors.success} />
        </View>
      </Card>
    </Screen>
  );
}

function EarnCard({ label, value }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.earnCard}>
      <Text style={[typography.h3, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.small, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, marginBottom: spacing.lg },
  headerLeft: { flex: 1, gap: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#2E7BB0',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  section: { marginTop: spacing.xl },
  earnRow: { flexDirection: 'row', gap: spacing.md },
  earnCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 2,
  },
  emptyCard: { gap: 2 },
  insuranceCard: { marginTop: spacing.md },
  insuranceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});