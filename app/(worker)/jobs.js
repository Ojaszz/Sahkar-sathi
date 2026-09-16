import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, EmptyState, Button, StatusBadge } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { colors, radius, spacing, typography } from '../../src/theme';
import { getService } from '../../src/data/services';
import { formatINR, formatDate } from '../../src/utils/format';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { t } from '../../src/i18n';

const TABS = [
  { key: 'requests', label: 'Requests' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'history', label: 'History' },
];

export default function WorkerJobs() {
  const styles = makeStyles(colors);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { bookings, loadBookings, setStatus } = useBookingStore();
  const [tab, setTab] = useState('requests');

  useEffect(() => {
    loadBookings();
  }, []);

  const workerId = user?.id || 'w1';
  const my = useMemo(() => bookings.filter((b) => b.workerId === workerId), [bookings, workerId]);

  const filtered = useMemo(() => {
  const styles = makeStyles(colors);
    if (tab === 'requests') return my.filter((b) => b.status === 'requested');
    if (tab === 'upcoming') return my.filter((b) => ['confirmed', 'inProgress'].includes(b.status));
    return my.filter((b) => ['completed', 'cancelled'].includes(b.status));
  }, [my, tab]);

  const accept = async (b) => {
  const styles = makeStyles(colors);
    await setStatus(b.id, 'confirmed');
  };
  const reject = async (b) => {
  const styles = makeStyles(colors);
    await setStatus(b.id, 'cancelled');
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('workerApp.jobs')}</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tb) => (
          <Pressable key={tb.key} style={[styles.tab, tab === tb.key && styles.tabActive]} onPress={() => setTab(tb.key)}>
            <Text style={[typography.captionMedium, tab === tb.key && { color: '#2E7BB0' }]}>{tb.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: spacing.md }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title={t('workerApp.noJobs')}
            note={t('workerApp.noJobsNote')}
          />
        }
        renderItem={({ item }) => (
          <JobCard booking={item} onPress={() => router.push(`/booking/${item.id}`)} onAccept={() => accept(item)} onReject={() => reject(item)} />
        )}
      />
    </Screen>
  );
}

function JobCard({ booking, onPress, onAccept, onReject }) {
  const styles = makeStyles(colors);
  const service = getService(booking.service);
  const isRequest = booking.status === 'requested';
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.icon, { backgroundColor: `${service.color}22` }]}>
          <MaterialCommunityIcons name={service.icon} size={22} color={service.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.bodyBold}>{booking.customerName}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t(`categories.${booking.service}`)} • {formatDate(booking.date)} • {booking.time}
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