import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, SectionHeader, CoopCallout } from '../../src/components/ui';
import { WorkerCard } from '../../src/components/worker';
import Avatar from '../../src/components/ui/Avatar';
import { SearchBar, CategoryGrid } from '../../src/components/home';
import { colors, spacing, radius, typography } from '../../src/theme';
import { SERVICES } from '../../src/data/services';
import { useAuthStore } from '../../src/store/authStore';
import { useWorkerStore } from '../../src/store/workerStore';
import { useBookingStore } from '../../src/store/bookingStore';
import { useNotificationsStore } from '../../src/store/notificationsStore';
import { t } from '../../src/i18n';

export default function CustomerHome() {
  const styles = makeStyles(colors);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const items = useNotificationsStore((s) => s.items);
  const refreshNotifs = useNotificationsStore((s) => s.refresh);
  const setQuery = useWorkerStore((s) => s.setQuery);
  const setCategory = useWorkerStore((s) => s.setCategory);
  const setSortBy = useWorkerStore((s) => s.setSortBy);
  const loadBookings = useBookingStore((s) => s.loadBookings);
  const visibleWorkers = useWorkerStore.getState().visibleWorkers;

  useEffect(() => {
    refreshNotifs(user?.id, user?.role);
  }, []);

  // featured = top rated, available
  const featured = visibleWorkers()
    .filter((w) => w.available && w.rating >= 4.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  useEffect(() => {
    loadBookings();
  }, []);

  const greet = () => {
  const styles = makeStyles(colors);
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const openCategory = (id) => {
  const styles = makeStyles(colors);
    setCategory(id);
    setSortBy('rating');
    setQuery('');
    router.push('/(customer)/search');
  };

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[typography.captionMedium, { color: colors.textMuted }]}>{greet()},</Text>
          <Text style={[typography.h2, { color: colors.primaryDark }]}>
            {user?.name?.split(' ')[0]} 🙏
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.notifBtn} hitSlop={8}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
            {items.length > 0 ? <View style={styles.notifDot} /> : null}
          </Pressable>
          <Pressable onPress={() => router.push('/(customer)/profile')} style={styles.avatarBtn}>
            <Avatar emoji={user?.avatar || '👤'} size={44} />
          </Pressable>
        </View>
      </View>

      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
        {t('home.subtitle')}
      </Text>

      {/* Search */}
      <SearchBar
        placeholder={t('home.searchPlaceholder')}
        onChange={(v) => setQuery(v)}
        onSubmit={() => router.push('/(customer)/search')}
      />

      {/* Emergency + coop banner */}
      <View style={styles.bannerRow}>
        <Pressable style={styles.emergency} onPress={() => router.push('/emergency')}>
          <MaterialCommunityIcons name="alert-decagram" size={22} color={colors.danger} />
          <View>
            <Text style={[typography.captionMedium, { color: colors.danger }]}>{t('home.emergency')}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>24×7 urgent help</Text>
          </View>
        </Pressable>
        <CoopCallout
          style={styles.coopBanner}
          icon="hand-coin"
          title={t('onboard.fairWages')}
          note={t('onboard.verified')}
        />
      </View>

      {/* Categories */}
      <SectionHeader title={t('home.categories')} style={styles.section} />
      <CategoryGrid
        categories={SERVICES.map((s) => ({ ...s, label: t(`categories.${s.id}`) }))}
        onSelect={openCategory}
      />

      {/* Featured */}
      <SectionHeader
        title={t('home.featured')}
        action={t('common.seeAll')}
        onAction={() => router.push('/(customer)/search')}
        style={styles.section}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {featured.map((w) => (
          <View key={w.id} style={styles.featuredCard}>
            <Pressable onPress={() => router.push(`/worker/${w.id}`)}>
              <View style={styles.featuredTop}>
                <Avatar emoji={w.avatar} size={52} online={w.available} />
                <View style={styles.ratingPill}>
                  <MaterialCommunityIcons name="star" size={12} color={colors.white} />
                  <Text style={[typography.smallBold, { color: colors.white }]}>{w.rating}</Text>
                </View>
              </View>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{w.name}</Text>
              <Text style={[typography.small, { color: colors.textSecondary }]}>{t(`categories.${w.service}`)}</Text>
              <Text style={[typography.smallBold, { color: colors.accent }]}>
                {t('home.startingAt', { price: w.price })} • {w.distance} {t('home.kmAway')}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Full worker list preview */}
      <SectionHeader
        title={t('home.nearYou')}
        action={t('home.viewAllWorkers')}
        onAction={() => router.push('/(customer)/search')}
        style={styles.section}
      />
      {visibleWorkers()
        .slice(0, 3)
        .map((w) => (
          <WorkerCard key={w.id} worker={w} />
        ))}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  headerLeft: { flex: 1, gap: 2 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  avatarBtn: { borderWidth: 2, borderColor: colors.primary, borderRadius: 24 },
  bannerRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  emergency: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  coopBanner: { flex: 1.6 },
  section: { marginTop: spacing.xl },
  featuredCard: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.md,
  },
  featuredTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    gap: 2,
  },
});