import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Card, SectionHeader, CoopCallout, Badge } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { BookingCard } from '../../src/components/booking';
import { colors, radius, spacing, typography } from '../../src/theme';
import { getWorker, isKnownWorker } from '../../src/data/workers';
import { useAuthStore } from '../../src/store/authStore';
import { useBookingStore } from '../../src/store/bookingStore';
import { useSyncStore } from '../../src/store/syncStore';
import { useDeclineStore } from '../../src/store/declineStore';
import { useNotificationsStore } from '../../src/store/notificationsStore';
import { useTagAlongStore } from '../../src/store/tagAlongStore';
import { ratingSnapshot } from '../../src/utils/ratings';
import { TAG_ALONG_LIMIT } from '../../src/utils/constants';
import { formatINR } from '../../src/utils/format';
import { t } from '../../src/i18n';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function WorkerDashboard() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { bookings, loadBookings } = useBookingStore();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const refreshNotifs = useNotificationsStore((s) => s.refresh);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    loadBookings();
    refreshNotifs(user?.id, user?.role);
    const unsub = useBookingStore.subscribe(() => refreshNotifs(user?.id, user?.role));
    return unsub;
  }, [user?.id]);

  const workerId = user?.id || 'w1';
  // Known catalogue workers (demo ids w1/w2/…) have real stats; a worker who
  // registered with email is brand new — greeting + rating reflect that.
  const known = isKnownWorker(user?.id);
  const myBookings = bookings.filter((b) => b.workerId === workerId);
  // Live requests are unclaimed rows (worker_id null) that arrive via the poll,
  // so the "new requests" banner must count the LIVE feed, not myBookings.
  const liveFeed = useSyncStore((s) => s.liveFeed);
  const declined = useDeclineStore((s) => s.byWorker)[workerId] || new Set();
  const requests = useMemo(
    () => liveFeed.filter((b) => b.status === 'requested' && !declined.has(b.id)),
    [liveFeed, declined]
  );
  const today = myBookings.filter((b) => ['confirmed', 'inProgress'].includes(b.status));
  const completed = myBookings.filter((b) => b.status === 'completed');
  const monthEarnings = completed.reduce((s, b) => s + b.amount, 0);
  const sharedRows = useTagAlongStore((s) => s.rows);
  const catalog = known ? getWorker(workerId) : null;
  const snapshot = !known ? ratingSnapshot(user?.id, myBookings, sharedRows) : null;
  const pendingRequests = sharedRows.filter((r) => r.mentorId === workerId && r.status === 'pending');
  const activeMentees = sharedRows.filter((r) => r.mentorId === workerId && r.status === 'accepted');
  const completedPairs = sharedRows.filter((r) => r.mentorId === workerId && r.status === 'completed');
  const juniorDone = sharedRows.filter((r) => r.juniorId === user?.id && r.status === 'completed').length;
  const graduated = !known && juniorDone >= TAG_ALONG_LIMIT;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[typography.captionMedium, { color: colors.textMuted }]}>
            {known ? 'Welcome back,' : 'Welcome,'}
          </Text>
          <Text style={[typography.h2, { color: colors.text }]}>
            {user?.name?.split(' ')[0]} {user?.role === 'worker' ? '🔧' : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.notifBtn} hitSlop={8}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
            {unreadCount > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            ) : null}
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

      {/* Junior side (registered worker): tag along & grow your rating */}
      {!known && graduated ? (
        <View style={styles.tagGraduated}>
          <View style={styles.tagIcon}>
            <MaterialCommunityIcons name="school" size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{t('tagAlong.graduated')}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {t('tagAlong.graduatedNote')}
            </Text>
          </View>
        </View>
      ) : null}
      {!known && !graduated ? (
        <Pressable style={styles.tagCta} onPress={() => router.push('/(worker)/tagalong')}>
          <View style={styles.tagIcon}>
            <MaterialCommunityIcons name="account-group" size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.tagTitleRow}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{t('tagAlong.dashTitle')}</Text>
              <Badge label={t('tagAlong.limitOf', { done: juniorDone, limit: TAG_ALONG_LIMIT })} color={juniorDone >= TAG_ALONG_LIMIT - 1 ? colors.warning : colors.accent} />
            </View>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {snapshot?.count
                ? t('tagAlong.dashHasRatings', { rating: snapshot.avg, count: snapshot.count })
                : t('tagAlong.dashZero')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </Pressable>
      ) : null}

      {/* Mentor side (catalogue worker): take-along requests + active mentees */}
      {known && (pendingRequests.length > 0 || activeMentees.length > 0) ? (
        <Card style={styles.mentorCard}>
          <View style={styles.mentorHead}>
            <MaterialCommunityIcons name="account-plus" size={20} color={colors.accent} />
            <Text style={[typography.bodyBold, { color: colors.text }]}>{t('tagAlong.requestsTitle')}</Text>
            {activeMentees.length > 0 ? (
              <Badge label={t('tagAlong.youAreTagged', { n: activeMentees.length })} color={colors.accent} />
            ) : null}
          </View>
          {pendingRequests.map((r) => (
            <View key={r.id} style={styles.reqRow}>
              <Avatar emoji="🧑‍🔧" size={40} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.captionMedium, { color: colors.text }]}>{r.juniorName}</Text>
                <Text style={[typography.small, { color: colors.textMuted }]} numberOfLines={1}>
                  {t('tagAlong.wantsToLearn', { service: t(`categories.${catalog.service}`) })}
                </Text>
              </View>
              <Pressable style={styles.acceptBtn} onPress={() => useTagAlongStore.getState().respond(r.id, 'accepted')}>
                <Text style={[typography.captionMedium, { color: colors.white }]}>{t('tagAlong.acceptRequest')}</Text>
              </Pressable>
              <Pressable style={styles.declineBtn} hitSlop={8} onPress={() => useTagAlongStore.getState().respond(r.id, 'rejected')}>
                <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
          {activeMentees.map((r) => (
            <View key={r.id} style={styles.reqRow}>
              <Avatar emoji="🧑‍🔧" size={40} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.captionMedium, { color: colors.text }]}>{r.juniorName}</Text>
                <Text style={[typography.small, { color: colors.success }]}>● {t('tagAlong.acceptedLive')}</Text>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Earnings summary */}
      <SectionHeader title={t('workerApp.earningSummary')} style={styles.section} />
      <View style={styles.earnRow}>
        <EarnCard label={t('workerApp.month')} value={formatINR(monthEarnings)} />
        <EarnCard label={t('workerApp.jobsDone')} value={completed.length} />
        <EarnCard label={t('workerApp.avgRating')} value={known ? `${catalog.rating}★` : snapshot?.count ? `${snapshot.avg}★` : '0.0★'} />
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
          <MaterialCommunityIcons name="shield-check" size={26} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold}>{t('profile.insurance')}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              ₹5,00,000 life cover • Accident • Hospitalisation
            </Text>
          </View>
          <Badge label={t('common.active')} color={colors.success} />
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
  notifBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: colors.danger, borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  notifBadgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
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
  tagCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  tagGraduated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  tagTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tagIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  mentorCard: { marginBottom: spacing.md },
  mentorHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  acceptBtn: { backgroundColor: colors.success, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  declineBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerLight },
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