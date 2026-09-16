import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Card, Badge, StatusBadge } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { ProfileMenu, MenuItem, MenuGroup } from '../../src/components/profile/SettingsPanel';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useBookingStore } from '../../src/store/bookingStore';
import { getWorker } from '../../src/data/workers';
import { INSURANCE_POLICIES } from '../../src/utils/constants';
import { t } from '../../src/i18n';

export default function WorkerProfile() {
  const styles = makeStyles(colors);
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingStore((s) => s.bookings);
  const worker = getWorker(user?.id || 'w1');
  const my = bookings.filter((b) => b.workerId === (user?.id || 'w1'));
  const completed = my.filter((b) => b.status === 'completed').length;

  return (
    <Screen>
      {/* Profile header */}
      <View style={styles.header}>
        <Avatar emoji={user?.avatar || '👨‍🔧'} size={76} online style={styles.avatar} />
        <Text style={[typography.h1, { color: colors.text }]}>{user?.name || worker.name}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{t(`categories.${worker.service}`)} • {t('worker.memberSince', { year: worker.memberSince })}</Text>
        <View style={styles.badgeRow}>
          <Badge label={t('worker.verifiedBadge')} color={colors.success} />
          <Badge label={t('worker.fairWage')} color={colors.accent} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatBox label={t('workerApp.jobsDone')} value={completed} />
        <StatBox label="Rating" value={worker.rating.toFixed(1)} />
        <StatBox label={t('workerApp.available')} value={worker.available ? 'Yes' : 'No'} />
      </View>

      {/* Insurance & welfare — core differentiator */}
      <Text style={[typography.h3, styles.section]}>{t('profile.insurance')}</Text>
      <Card style={styles.insuranceCard}>
        <View style={styles.insuranceHeader}>
          <MaterialCommunityIcons name="shield-heart" size={26} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold}>Federation Group Insurance</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {worker.insuranceCover}
            </Text>
          </View>
          <StatusBadge status="confirmed" label="Active" />
        </View>
        <View style={styles.divider} />
        {INSURANCE_POLICIES.map((p) => (
          <View key={p.name} style={styles.policyRow}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionMedium, { color: colors.text }]}>{p.name}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{p.detail}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Coop contribution transparency */}
      <Card style={styles.coopCard}>
        <View style={styles.coopRow}>
          <MaterialCommunityIcons name="hand-coin" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.captionMedium, { color: colors.primaryDark }]}>Fair wage share</Text>
            <Text style={[typography.small, { color: colors.primaryDark, opacity: 0.8 }]}>
              92% of every booking goes directly to you. 8% funds your insurance & welfare.
            </Text>
          </View>
        </View>
      </Card>

      {/* Menu */}
      <ProfileMenu user={user} />
    </Screen>
  );
}

function StatBox({ label, value }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.statBox}>
      <Text style={[typography.h3, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.small, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { alignItems: 'center', paddingTop: spacing.xl, gap: 5, marginBottom: spacing.lg },
  avatar: { borderWidth: 3, borderColor: '#2E7BB0', marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 2,
  },
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  insuranceCard: { marginBottom: spacing.md },
  insuranceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  policyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.sm },
  coopCard: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accentLight,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  coopRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
});