import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../theme';
import { customerLocationFor, distanceKm } from '../../utils/geo';
import Avatar from '../ui/Avatar';
import { t } from '../../i18n';

// Bottom sheet card overlaying the live-tracking map. Shows LIVE status, the worker
// (avatar + name + trade), a big distance readout, and an ETA. Falls back to a static
// "waiting" state until the worker actually starts the job (status === inProgress).
export default function TrackingCard({ booking, worker, tracking }) {
  const styles = makeStyles(colors);

  const isWaiting = booking.status !== 'inProgress';
  const arrived = tracking?.status === 'arrived';

  // While the simulation is starting, derive a static readout from the base distance
  const start = worker.location;
  const customer = customerLocationFor(booking);
  const dist = tracking ? tracking.distance : distanceKm(start, customer);
  const etaMin = tracking ? tracking.etaMin : Math.max(1, Math.ceil(dist * 1.2));

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />

      {/* Status row */}
      <View style={styles.head}>
        <View style={[styles.livePill, arrived && styles.livePillArrived]}>
          <View style={[styles.liveDot, arrived && styles.liveDotArrived]} />
          <Text style={[typography.smallBold, { color: arrived ? colors.success : colors.danger }]}>
            {arrived ? t('tracking.arrived') : t('tracking.live')}
          </Text>
        </View>
      </View>

      {/* Worker row */}
      <View style={styles.workerRow}>
        <Avatar emoji={worker.avatar} size={52} online={worker.available} />
        <View style={styles.workerInfo}>
          <Text style={[typography.h3, { color: colors.text }]} numberOfLines={1}>
            {worker.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {t(`categories.${worker.service}`)}
          </Text>
        </View>
        <MaterialCommunityIcons name="shield-check" size={20} color={colors.primary} />
      </View>

      {/* Big readout */}
      <View style={styles.readout}>
        {arrived ? (
          <>
            <MaterialCommunityIcons name="check-decagram" size={40} color={colors.success} />
            <Text style={[typography.h1, { color: colors.success }]}>{t('tracking.arrived')}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {t('tracking.onTheWay')}
            </Text>
          </>
        ) : isWaiting ? (
          <>
            <MaterialCommunityIcons name="clock-outline" size={34} color={colors.textSecondary} />
            <Text style={[typography.h2, { color: colors.text }]}>{t('tracking.waiting')}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {dist.toFixed(1)} {t('tracking.kmAway')}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.distRow}>
              <Text style={[typography.display, { color: colors.text }]}>{dist.toFixed(1)}</Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                {t('tracking.kmAway')}
              </Text>
            </View>
            <Text style={[typography.body, { color: colors.primary }]}>
              {t('tracking.arrivingIn', { min: etaMin })}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: radius.round,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  head: { flexDirection: 'row', justifyContent: 'flex-end' },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.round,
    backgroundColor: colors.dangerLight,
  },
  livePillArrived: { backgroundColor: colors.successLight },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  liveDotArrived: { backgroundColor: colors.success },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  workerInfo: { flex: 1 },
  readout: { alignItems: 'center', gap: 4, paddingTop: spacing.xs },
  distRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
});
