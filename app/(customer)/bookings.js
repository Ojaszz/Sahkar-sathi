import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, EmptyState } from '../../src/components/ui';
import { BookingCard } from '../../src/components/booking';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { t } from '../../src/i18n';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function CustomerBookings() {
  const styles = makeStyles(colors);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { bookings, loadBookings } = useBookingStore();
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    loadBookings();
  }, []);

  const myBookings = useMemo(
    () => bookings.filter((b) => b.customerId === user?.id),
    [bookings, user]
  );

  const filtered = useMemo(() => {
  const styles = makeStyles(colors);
    if (tab === 'upcoming') return myBookings.filter((b) => ['requested', 'confirmed', 'inProgress'].includes(b.status));
    if (tab === 'completed') return myBookings.filter((b) => b.status === 'completed');
    return myBookings.filter((b) => b.status === 'cancelled');
  }, [myBookings, tab]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('bookings.title')}</Text>
      </View>

      {myBookings.length === 0 ? (
        <EmptyState
          icon="calendar-clock"
          title={t('bookings.empty')}
          note={t('bookings.emptyNote')}
        />
      ) : (
        <>
          <View style={styles.tabs}>
            {TABS.map((tb) => (
              <Pressable key={tb.key} style={[styles.tab, tab === tb.key && styles.tabActive]} onPress={() => setTab(tb.key)}>
                <Text style={[typography.captionMedium, tab === tb.key && { color: colors.primary }]}>{tb.label}</Text>
              </Pressable>
            ))}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(b) => b.id}
            renderItem={({ item }) => <BookingCard booking={item} />}
            contentContainerStyle={{ paddingBottom: 120, paddingTop: spacing.md }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState icon="calendar-blank" title={t('bookings.empty')} note={t('bookings.emptyNote')} />
            }
          />
        </>
      )}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { marginTop: spacing.md, marginBottom: spacing.md },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    overflow: 'hidden',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 4, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.surface },
});