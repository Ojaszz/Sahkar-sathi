import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Card, Modal, StatusBadge, CoopCallout, StarInput, Input } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { colors, radius, spacing, typography } from '../../src/theme';
import { getWorker } from '../../src/data/workers';
import { getService } from '../../src/data/services';
import { formatINR, formatDate } from '../../src/utils/format';
import { customerLocationFor } from '../../src/utils/geo';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { useSyncStore } from '../../src/store/syncStore';
import { useChatStore } from '../../src/store/chatStore';
import { useDeclineStore } from '../../src/store/declineStore';
import { t } from '../../src/i18n';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function BookingDetailScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { getById, setStatus, cancelBooking, addReview } = useBookingStore();
  const acceptBooking = useSyncStore((s) => s.acceptBooking);
  const startJob = useSyncStore((s) => s.startJob);
  const endJob = useSyncStore((s) => s.endJob);
  const booking = getById(id);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const openedTrackRef = useRef(null);
  const [nowTick, setNowTick] = useState(0);

  // LIVE demo moment: the instant the worker flips the job to inProgress, the
  // customer phone auto-opens the tracking screen (poll merges the row in ~1.5s).
  useEffect(() => {
    const bid = String(id);
    if (
      booking?.status === 'inProgress' &&
      booking.isLive &&
      user?.role !== 'worker' &&
      openedTrackRef.current !== bid
    ) {
      openedTrackRef.current = bid;
      router.replace(`/track/${bid}`);
    }
  }, [booking?.status, booking?.id]);

  // Tick the elapsed timer once a second while a job is RUNNING (worker started it,
  // hasn't ended it). 1 real second = 1 demo minute; the re-render lets the bill
  // preview grow live so "billed for only time taken" is visible as it happens.
  useEffect(() => {
    if (user?.role !== 'worker') return;
    if (!booking || booking.status !== 'inProgress' || !booking.startedAt || booking.endedAt) return;
    const iv = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, [user?.role, booking?.status, booking?.startedAt, booking?.endedAt]);

  if (!booking) {
    return (
      <Screen>
        <Text style={[typography.h2, styles.missing]}>{t('bookings.bookingNotFound')}</Text>
        <Button title={t('common.back')} variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const worker = getWorker(booking.workerId);
  const service = getService(booking.service);
  const isCustomer = user?.role !== 'worker';

  // Time-taken billing. Hourly rate is implicit in the booking (agreed base ÷
  // booked hours). Every real second the job runs = 1 demo minute, so the bill is
  // rate × demoMinutes/60 and grows live while the worker is on the clock.
  const rate = booking.hours ? booking.amount / booking.hours : worker.price;
  const started = !!booking.startedAt && !booking.endedAt;
  const demoMinutes = started
    ? Math.max(0, Math.floor((Date.now() - booking.startedAt) / 1000))
    : booking.durationMin || 0;
  const liveBase = Math.round(rate * (demoMinutes / 60));
  const liveCoop = Math.round(liveBase * 0.08);

  const doCancel = () => {
    Alert.alert(t('bookings.cancelBooking'), t('bookings.cancelBookingQ'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: async () => {
          await cancelBooking(booking.id);
          router.back();
        },
      },
    ]);
  };

  const submitReview = async () => {
    await addReview(booking.id, rating, reviewText.trim() || t('bookings.greatService'));
    setShowReview(false);
    router.back();
  };

  const statusTrack = ['requested', 'confirmed', 'inProgress', 'completed'];
  const stage = statusTrack.indexOf(booking.status);

  return (
    <Screen scroll>
      {/* Header card */}
      <View style={styles.hero}>
        <View style={[styles.heroBg, { backgroundColor: service.color + '1A' }]} />
        <Avatar emoji={worker.avatar} size={72} online={worker.available} style={styles.heroAvatar} />
        <Text style={[typography.h1, { color: colors.text }]}>{worker.name}</Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          {t(`categories.${booking.service}`)}
        </Text>
        <StatusBadge status={booking.status} label={t(`booking.status.${booking.status}`)} />
      </View>

      {/* Timeline for active bookings */}
      {stage >= 0 && booking.status !== 'cancelled' ? (
        <Card style={styles.timeline}>
          {statusTrack.map((s, i) => (
            <View key={s} style={styles.step}>
              <View style={[styles.stepDot, i <= stage && styles.stepDone]}>
                {i < stage ? <MaterialCommunityIcons name="check" size={12} color={colors.white} /> : null}
              </View>
              {i < statusTrack.length - 1 ? <View style={[styles.stepLine, i < stage && styles.stepLineDone]} /> : null}
              <Text style={[typography.small, { color: i <= stage ? colors.text : colors.textMuted }]}>
                {t(`booking.status.${s}`)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {/* Details */}
      <Card style={styles.details}>
        <DetailRow icon="calendar" label={t('booking.date')} value={formatDate(booking.date)} />
        <DetailRow icon="clock-outline" label={t('booking.time')} value={booking.time} />
        <DetailRow icon="timelapse" label={t('booking.duration')} value={`${booking.hours || 1} ${t('booking.hours')}`} />
        {demoMinutes ? (
          <DetailRow icon="timer-outline" label={t('booking.timeTaken')} value={`${fmtDemoMinutes(demoMinutes)}${started ? ` · ${t('workerApp.demoClock')}` : ''}`} />
        ) : null}
        <DetailRow icon="map-marker-outline" label={t('booking.address')} value={booking.address} />
        <DetailRow icon="text-box-outline" label={t('booking.issue')} value={booking.issue} />
        <DetailRow icon="flag-outline" label={t('booking.status.requested')} value={booking.id.toUpperCase()} />
      </Card>

      {/* Pricing */}
      <Card style={styles.details}>
        <Row
          label={
            booking.durationMin
              ? `${t('booking.timeTaken')} · ${fmtDemoMinutes(booking.durationMin)}`
              : started
              ? t('workerApp.billedSoFar', { time: fmtDemoMinutes(demoMinutes) })
              : `${t('booking.hourlyRate')} · ${booking.hours || 1} ${t('booking.hours')}`
          }
          value={formatINR(started ? liveBase : booking.amount)}
        />
        <Row label={t('booking.coopFee')} value={formatINR(started ? liveCoop : booking.coopFee || 0)} muted />
        <View style={styles.divider} />
        <Row
          label={t('booking.total')}
          value={formatINR((started ? liveBase : booking.amount) + (started ? liveCoop : booking.coopFee || 0))}
          bold
        />
        {booking.payment === 'paid' ? (
          <View style={styles.paidRow}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={[typography.captionMedium, { color: colors.success }]}>
              {t('bookings.paid')} • {booking.paymentMethod === 'cash' ? t('bookings.cash') : booking.paymentMethod}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Differentiator callout */}
      <CoopCallout
        icon="hand-coin"
        title={t('onboard.fairWages')}
        note={`${formatINR(booking.coopFee)} (${t('workerApp.cooperativeFee')}) ${t('bookings.coopNote')}`}
        style={{ marginTop: spacing.md }}
      />

      {/* Actions by status */}
      <View style={styles.actions}>
        {booking.status === 'requested' && isCustomer && (
          <>
            <Button title={t('bookings.needHelp')} variant="outline" onPress={() => router.push('/emergency')} />
            <Button title={t('bookings.cancelBooking')} variant="dangerOutline" onPress={doCancel} />
          </>
        )}

        {(booking.status === 'confirmed' || booking.status === 'inProgress') && isCustomer && (
          <Button
            title={t('bookings.trackBooking')}
            variant="outline"
            icon={<MaterialCommunityIcons name="map-marker-radius" size={18} color={colors.primary} />}
            onPress={() => router.push(`/track/${booking.id}`)}
          />
        )}

        {(booking.status === 'confirmed' || booking.status === 'inProgress') && isCustomer && booking.payment !== 'paid' && (
          <Button
            title={t('bookings.payNow')}
            onPress={() => router.push(`/payment?bookingId=${booking.id}`)}
          />
        )}

        {booking.status === 'completed' && isCustomer && !booking.reviewed && (
          <Button title={t('bookings.rateService')} onPress={() => setShowReview(true)} />
        )}

        {!isCustomer && booking.status === 'requested' && (
          <View style={styles.workerActions}>
            <Button
              title={t('workerApp.reject')}
              variant="dangerOutline"
              style={{ flex: 1 }}
              onPress={() => {
                // Personal pass — book stays 'requested' for others, just dropped from this worker's list.
                useDeclineStore.getState().decline(user?.id || booking.workerId || 'w1', booking.id);
                router.back();
              }}
            />
            <Button
              title={t('workerApp.accept')}
              style={{ flex: 1 }}
              onPress={async () => {
                const res = await acceptBooking(booking.id, user?.id || 'w1', user?.name || 'Worker');
                if (res.ok && res.booking) {
                  useChatStore.getState().greetFromWorker({
                    customerId: res.booking.customerId,
                    workerId: res.booking.workerId,
                    workerName: res.booking.workerName,
                    customerName: res.booking.customerName,
                    service: res.booking.service,
                  });
                  router.back();
                } else if (res.taken) {
                  Alert.alert(t('workerApp.acceptLost'), t('workerApp.takenFirst'));
                } else if (res.error) {
                  Alert.alert(t('bookings.couldNotAccept'), res.error);
                } else {
                  Alert.alert(t('workerApp.acceptLost'), t('workerApp.takenFirst'));
                }
              }}
            />
          </View>
        )}
        {!isCustomer && booking.status === 'confirmed' && (
          <Button title={t('workerApp.startJob')} onPress={() => setStatus(booking.id, 'inProgress')} />
        )}
        {!isCustomer && booking.status === 'inProgress' && (
          <>
            <Button
              title={t('workerApp.getDirections')}
              variant="outline"
              icon={<MaterialCommunityIcons name="directions" size={18} color={colors.primary} />}
              onPress={() => {
                const [lat, lng] = customerLocationFor(booking);
                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
              }}
            />
            {!started ? (
              <Button title={t('workerApp.startJob')} onPress={() => startJob(booking.id)} />
            ) : (
              <>
                <View style={styles.timerCard}>
                  <MaterialCommunityIcons name="timer-sand" size={22} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text }]}>
                      {fmtDemoMinutes(demoMinutes)} · {formatINR(liveBase)}
                    </Text>
                    <Text style={[typography.small, { color: colors.textSecondary }]}>
                      {t('workerApp.runningNow')} · {t('workerApp.demoClock')}
                    </Text>
                  </View>
                </View>
                <Button title={t('workerApp.endJob')} onPress={() => endJob(booking.id)} />
              </>
            )}
          </>
        )}
      </View>

      {/* Review modal */}
      <Modal visible={showReview} onClose={() => setShowReview(false)} title={t('bookings.rateService')}>
        <View style={{ alignItems: 'center', gap: spacing.lg }}>
          <StarInput value={rating} onChange={setRating} />
          <Input
            label={t('bookings.yourReview')}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder={t('bookings.writeReview')}
            multiline
            style={{ width: '100%' }}
          />
          <Button title={t('bookings.submitReview')} onPress={submitReview} />
        </View>
      </Modal>
    </Screen>
  );
}

// Demo clock formatting — 1 real second = 1 demo minute (45 real sec → "45m").
function fmtDemoMinutes(min) {
  if (!min || min < 60) return `${min || 0}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function DetailRow({ icon, label, value }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={17} color={colors.textMuted} />
      <View style={styles.detailText}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[typography.body, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function Row({ label, value, muted, bold }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.row}>
      <Text style={[typography.body, muted && { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typography.bodyBold, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: spacing.xl, gap: 5, marginBottom: spacing.lg },
  heroBg: { position: 'absolute', top: -120, left: 0, right: 0, height: 260 },
  heroAvatar: { borderWidth: 3, borderColor: colors.white },
  missing: { marginVertical: spacing.xxxl, textAlign: 'center' },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  step: { alignItems: 'center', width: 60 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDone: { backgroundColor: colors.success, borderColor: colors.success },
  details: { marginBottom: spacing.md, gap: 8 },
  detailRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  detailText: { flex: 1, gap: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.lg,
  },
  actions: { gap: spacing.md, marginTop: spacing.lg },
  workerActions: { flexDirection: 'row', gap: spacing.md },
});