import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, EmptyState, Button, StatusBadge } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { colors, radius, spacing, typography } from '../../src/theme';
import { getService } from '../../src/data/services';
import { formatINR, formatDate } from '../../src/utils/format';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { useSyncStore } from '../../src/store/syncStore';
import { useDeclineStore } from '../../src/store/declineStore';
import { useChatStore } from '../../src/store/chatStore';
import { t } from '../../src/i18n';
import { useSettingsStore } from '../../src/store/settingsStore';

const TABS = [
  { key: 'requests', labelKey: 'workerApp.tabRequests' },
  { key: 'upcoming', labelKey: 'workerApp.tabUpcoming' },
  { key: 'history', labelKey: 'workerApp.tabHistory' },
];

export default function WorkerJobs() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { bookings, loadBookings, setStatus } = useBookingStore();
  const liveFeed = useSyncStore((s) => s.liveFeed);
  const online = useSyncStore((s) => s.online);
  const acceptBooking = useSyncStore((s) => s.acceptBooking);
  const declinedByWorker = useDeclineStore((s) => s.byWorker);
  const [tab, setTab] = useState('requests');

  useEffect(() => {
    loadBookings();
  }, []);

  const workerId = user?.id || 'w1';
  const my = useMemo(() => bookings.filter((b) => b.workerId === workerId), [bookings, workerId]);

  // LIVE feed: anything 'requested' (waiting for a worker) + my confirmed/inProgress.
  // Requests this worker has REJECTED (personal pass — not a board cancel) are
  // filtered out of their list but stay live for every other worker.
  const declined = declinedByWorker[workerId] || new Set();
  const liveRequests = useMemo(
    () => liveFeed.filter((b) => b.status === 'requested' && !declined.has(b.id)),
    [liveFeed, declined]
  );
  const liveMine = useMemo(
    () => liveFeed.filter((b) => b.workerId === workerId && ['confirmed', 'inProgress'].includes(b.status)),
    [liveFeed, workerId]
  );

  const filtered = useMemo(() => {
    if (tab === 'requests') {
      // Rejected requests re-appear dimmed at the BOTTOM so a mis-tap can be
      // reversed ("Re-take") — they're still live for every other worker on the board.
      if (liveRequests.length) {
        const passed = liveFeed.filter((b) => b.status === 'requested' && declined.has(b.id));
        return [...liveRequests, ...passed];
      }
      const all = my.filter((b) => b.status === 'requested');
      const kept = all.filter((b) => !declined.has(b.id));
      const passed = all.filter((b) => declined.has(b.id));
      return [...kept, ...passed];
    }
    if (tab === 'upcoming') return liveMine.length ? liveMine : my.filter((b) => ['confirmed', 'inProgress'].includes(b.status));
    return my.filter((b) => ['completed', 'cancelled'].includes(b.status));
  }, [tab, liveRequests, liveMine, my, declined]);

  const accept = async (b) => {
    if (liveRequests.length) {
      // Live mode: claim this job on Supabase (atomic — first tap wins), visible
      // to the customer instantly. A losing tap gets 'taken: true'.
      const res = await acceptBooking(b.id, user?.id || workerId, user?.name || 'Worker');
      if (res.ok && res.booking) {
        // Seed the live chat with a real first message from this worker so the
        // customer already has a conversation when they open the Chat tab.
        useChatStore.getState().greetFromWorker({
          customerId: res.booking.customerId,
          workerId: res.booking.workerId,
          workerName: res.booking.workerName,
          customerName: res.booking.customerName,
          service: res.booking.service,
        });
        router.push(`/booking/${res.booking.id}`);
      } else if (res.error) {
        Alert.alert(t('bookings.couldNotAccept'), res.error);
      } else {
        Alert.alert(t('workerApp.acceptLost'), t('workerApp.takenFirst'));
      }
      return;
    }
    await setStatus(b.id, 'inProgress');
  };
  const reject = async (b) => {
    // Reject = THIS worker passing on the request. The shared booking stays
    // 'requested' for the customer and other workers; it just drops off this
    // worker's list (persisted, undoable by tapping the card's Reject again).
    const refuse = useDeclineStore.getState();
    if (refuse.isDeclined(workerId, b.id)) refuse.unDecline(workerId, b.id);
    else refuse.decline(workerId, b.id);
  };

  return (
    <Screen scroll={false}>
      <View style={styles.headerRow}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('workerApp.jobs')}</Text>
        {liveRequests.length || online ? (
          <View style={[styles.liveChip, { backgroundColor: online ? colors.successLight : colors.warningLight }]}>
            <MaterialCommunityIcons name="radio-tower" size={13} color={online ? colors.success : colors.warning} />
            <Text style={[typography.small, { color: online ? colors.success : colors.warning }]}>
              {online ? t('workerApp.live') : t('workerApp.offline')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.tabs}>
        {TABS.map((tb) => (
          <Pressable key={tb.key} style={[styles.tab, tab === tb.key && styles.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[typography.captionMedium, tab === tb.key && { color: '#2E7BB0' }]}>{t(tb.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: spacing.md }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title={t('workerApp.noJobs')}
            note={t('workerApp.noJobsNote')}
          />
        }
        renderItem={({ item }) => (
          <JobCard
            booking={item}
            myService={user?.service}
            declined={declined.has(item.id)}
            onPress={() => router.push(`/booking/${item.id}`)}
            onAccept={() => accept(item)}
            onReject={() => reject(item)}
          />
        )}
      />
    </Screen>
  );
}

function JobCard({ booking, myService, declined, onPress, onAccept, onReject }) {
  const styles = makeStyles(colors);
  const service = getService(booking.service);
  const isRequest = booking.status === 'requested';
  const forYou = isRequest && !declined && myService && booking.service === myService;
  return (
    <Pressable style={[styles.card, declined && styles.cardPassed]} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.icon, { backgroundColor: `${service.color}22` }]}>
          <MaterialCommunityIcons name={service.icon} size={22} color={service.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={typography.bodyBold} numberOfLines={1}>{booking.customerName}</Text>
            {forYou ? (
              <View style={styles.youChip}>
                <Text style={[typography.captionMedium, { color: colors.accent }]}>{t('workerApp.forYou')}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t(`categories.${booking.service}`)} • {booking.hours || 1} {t('booking.hours')} • {booking.time === 'ASAP' ? t('workerApp.newRequest') : `${formatDate(booking.date)} • ${booking.time}`}
          </Text>
        </View>
        <StatusBadge status={booking.status} label={t(`booking.status.${booking.status}`)} />
      </View>

      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]} numberOfLines={2}>
        {booking.issue}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.address}>
          <MaterialCommunityIcons name="map-marker-outline" size={15} color={colors.textMuted} />
          <Text style={[typography.small, { color: colors.textMuted }]} numberOfLines={1}>{booking.address}</Text>
        </View>
        <Text style={[typography.h3, { color: colors.text }]}>{formatINR(booking.amount)}</Text>
      </View>

      {isRequest ? (
        <View style={styles.actions}>
          <Button title={t('workerApp.reject')} variant="dangerOutline" size="sm" style={{ flex: 1 }} onPress={onReject} />
          <Button title={t('workerApp.accept')} size="sm" style={{ flex: 1 }} onPress={onAccept} />
        </View>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { marginTop: spacing.md, marginBottom: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 4, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.infoLight },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardPassed: { opacity: 0.62, borderStyle: 'dashed' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  youChip: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  address: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});