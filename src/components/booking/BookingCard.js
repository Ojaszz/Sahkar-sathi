import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { getService } from '../../data/services';
import { getWorker } from '../../data/workers';
import { formatINR, formatDate } from '../../utils/format';
import { StatusBadge } from '../ui';
import { t } from '../../i18n';

export default function BookingCard({ booking }) {
  const styles = makeStyles(colors);
  const router = useRouter();
  const service = getService(booking.service);
  const worker = getWorker(booking.workerId);

  return (
    <Pressable
      onPress={() => router.push(`/booking/${booking.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: service.color + '22' }]}>
          <Text style={styles.emoji}>{worker.avatar}</Text>
        </View>
        <View style={styles.mid}>
          <Text style={typography.bodyBold}>{worker.name}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t(`categories.${booking.service}`)}
          </Text>
          <Text style={[typography.small, { color: colors.textMuted }]}>
            {formatDate(booking.date)} • {booking.time} • {booking.hours || 1} {t('booking.hours')}
          </Text>
        </View>
        <StatusBadge status={booking.status} label={t(`booking.status.${booking.status}`)} />
      </View>

      <View style={styles.divider} />

      {booking.syncFailed ? (
        <View style={styles.unsynced}>
          <MaterialCommunityIcons name="cloud-alert" size={13} color={colors.warning} />
          <Text style={[typography.small, { color: colors.warning }]}>
            {t('bookings.notPublished')}
          </Text>
        </View>
      ) : null}

      <View style={styles.bottomRow}>
        <Text numberOfLines={1} style={[typography.caption, styles.issue]}>{booking.issue}</Text>
        <View style={styles.amountWrap}>
          <Text style={[typography.h3, { color: colors.text }]}>{formatINR(booking.amount)}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.92 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  mid: { flex: 1, gap: 2 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  unsynced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.warningLight,
    borderRadius: radius.round,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  issue: { color: colors.textSecondary, flex: 1 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});