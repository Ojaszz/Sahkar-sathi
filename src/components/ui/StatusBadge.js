import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

// Human-friendly booking status map (keyed by status + optional role label)
export const STATUS_META = {
  requested: { label: 'requested', color: colors.info, icon: 'clock-outline' },
  confirmed: { label: 'confirmed', color: colors.success, icon: 'check-circle-outline' },
  inProgress: { label: 'inProgress', color: colors.warning, icon: 'progress-wrench' },
  completed: { label: 'completed', color: colors.success, icon: 'checkbox-marked-circle-outline' },
  cancelled: { label: 'cancelled', color: colors.danger, icon: 'close-circle-outline' },
};

export default function StatusBadge({ status, label }) {
  const styles = makeStyles(colors);
  const meta = STATUS_META[status] || STATUS_META.requested;
  return (
    <View style={[styles.badge, { backgroundColor: `${meta.color}18` }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[typography.smallBold, { color: meta.color }]}>{label || meta.label}</Text>
    </View>
  );
}

export function LoadingView({ label }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="small" />
      {label ? <Text style={typography.caption}>{label}</Text> : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.round,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
});