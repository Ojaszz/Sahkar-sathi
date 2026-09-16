import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { getService } from '../../data/services';
import { RatingBubble } from '../ui';
import { formatINR } from '../../utils/format';
import { t } from '../../i18n';

export default function WorkerCard({ worker, onPress }) {
  const styles = makeStyles(colors);
  const router = useRouter();
  const service = getService(worker.service);

  return (
    <Pressable
      onPress={onPress || (() => router.push(`/worker/${worker.id}`))}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, { backgroundColor: service.color + '22' }]}>
        <Text style={styles.emoji}>{worker.avatar}</Text>
        <View style={styles.availableDot} />
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={[styles.name, { flexShrink: 1 }]}>
            {worker.name}
          </Text>
          <MaterialCommunityIcons name="shield-check" size={16} color={colors.success} />
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t(`categories.${worker.service}`)} • {expLabel(worker.yearsExp)}
        </Text>
        <View style={styles.metaRow}>
          <RatingBubble rating={worker.rating} count={worker.reviewsCount} />
          <Text style={[typography.small, { color: colors.textMuted }]}>
            {worker.distance} {t('home.kmAway')}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>{formatINR(worker.price)}</Text>
        <Text style={[typography.small, { color: colors.accent }]}>hr</Text>
        {worker.available ? (
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={[typography.small, { color: colors.success }]}>{t('home.availableNow')}</Text>
          </View>
        ) : (
          <Text style={[typography.small, { color: colors.textMuted }]}>{t('home.offline')}</Text>
        )}
      </View>
    </Pressable>
  );
}

// Catalogue workers store a numeric year count; registered workers store the label
// they picked in onboarding ("1–3 years"). Render both without the " yrs" suffix
// when the label already carries it.
function expLabel(exp) {
  if (typeof exp === 'number') return `${exp} yrs`;
  if (typeof exp === 'string' && exp.includes('year')) return exp;
  return exp ? `${exp} yrs` : 'New member';
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.92 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  availableDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...typography.bodyBold, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  right: { alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 60 },
  price: { ...typography.h3, color: colors.text },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
});