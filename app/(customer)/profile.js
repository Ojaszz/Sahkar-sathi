import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Badge } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { ProfileMenu } from '../../src/components/profile/SettingsPanel';
import { colors, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { t } from '../../src/i18n';
import { useBookingStore } from '../../src/store/bookingStore';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function CustomerProfile() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingStore((s) => s.bookings);
  const myBookings = bookings.filter((b) => b.customerId === user?.id);
  const completed = myBookings.filter((b) => b.status === 'completed').length;

  return (
    <Screen>
      {/* Profile header */}
      <View style={styles.header}>
        <Avatar emoji={user?.avatar || '👤'} size={72} style={styles.avatar} />
        <Text style={[typography.h1, { color: colors.text }]}>{user?.name}</Text>
        <View style={styles.badgeRow}>
          <Badge label={t('profile.member')} color={colors.accent} icon={<MaterialCommunityIcons name="handshake" size={12} color={colors.accent} />} />
          <Badge label={t('home.verified')} color={colors.success} icon={<MaterialCommunityIcons name="shield-check" size={12} color={colors.success} />} />
        </View>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          📍 {user?.location} • {user?.phone}
        </Text>
      </View>

      {/* Quick stats */}
      <View style={styles.stats}>
        <StatBox value={myBookings.length} label={t('bookings.title')} icon="calendar-check" />
        <StatBox value={completed} label={t('profile.completedBookings')} icon="check-decagram" />
        <StatBox value={myBookings.filter((b) => b.status === 'inProgress').length} label={t('profile.activeBookings')} icon="progress-wrench" />
      </View>

      <ProfileMenu user={user} />
    </Screen>
  );
}

function StatBox({ value, label, icon }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.statBox}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      <Text style={[typography.h3, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { alignItems: 'center', paddingTop: spacing.xl, gap: 6, marginBottom: spacing.xl },
  avatar: { borderWidth: 3, borderColor: colors.primary, marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
});
