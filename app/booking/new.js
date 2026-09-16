import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Input, Card, Modal, CoopCallout } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { colors, radius, spacing, typography } from '../../src/theme';
import { getWorker } from '../../src/data/workers';
import { getService } from '../../src/data/services';
import { formatINR } from '../../src/utils/format';
import { TIME_SLOTS, USER_LOCATION } from '../../src/utils/constants';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { t } from '../../src/i18n';

export default function NewBookingScreen() {
  const styles = makeStyles(colors);
  const { workerId } = useLocalSearchParams();
  const router = useRouter();
  const worker = getWorker(workerId);
  const service = getService(worker.service);
  const user = useAuthStore((s) => s.user);

  const [date, setDate] = useState('2026-09-07');
  const [time, setTime] = useState('10:00 AM');
  const [issue, setIssue] = useState('');
  const [address, setAddress] = useState(user?.location || '');
  const [showSuccess, setShowSuccess] = useState(false);

  const dates = useMemo(() => {
  const styles = makeStyles(colors);
    // next 5 days starting tomorrow
    const days = [];
    const now = new Date();
    for (let i = 1; i <= 5; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      days.push(d);
    }
    return days.map((d) => ({ iso: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-IN', { weekday: 'short' }) + ', ' + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }));
  }, []);

  const coopFee = Math.round(worker.price * 0.08);
  const total = worker.price + coopFee;

  const confirm = async () => {
  const styles = makeStyles(colors);
    if (!worker.available) {
      Alert.alert(t('home.offline'), 'This worker is currently offline. Please pick an available worker.');
      return;
    }
    await useBookingStore.getState().createBooking({
      customerId: user.id,
      customerName: user.name,
      workerId: worker.id,
      service: worker.service,
      date,
      time,
      amount: worker.price,
      issue: issue.trim() || `${t(`categories.${worker.service}`)} service`,
      address,
    });
    setShowSuccess(true);
  };

  return (
    <Screen scroll>
      {/* Worker summary */}
      <Card style={styles.summary}>
        <Avatar emoji={worker.avatar} size={56} online={worker.available} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={typography.bodyBold}>{worker.name}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{t(`categories.${worker.service}`)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialCommunityIcons name="star" size={12} color={colors.star} />
            <Text style={[typography.smallBold, { color: colors.text }]}>{worker.rating}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>  {worker.distance} {t('home.kmAway')}</Text>
          </View>
        </View>
      </Card>

      {/* Date selection */}
      <Text style={[typography.h3, styles.label]}>{t('booking.selectDate')}</Text>
      <View style={styles.dateRow}>
        {dates.map((d) => (
          <Pressable
            key={d.iso}
            style={[styles.dateChip, date === d.iso && styles.dateChipActive]}
            onPress={() => setDate(d.iso)}
          >
            <Text style={[typography.small, date === d.iso && styles.dateTextActive]}>
              {d.label.split(',')[0]}
            </Text>
            <Text style={[typography.captionMedium, { color: colors.text }, date === d.iso && styles.dateTextActive]}>
              {d.label.split(', ')[1]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Time selection */}
      <Text style={[typography.h3, styles.label]}>{t('booking.selectTime')}</Text>
      <View style={styles.timeGrid}>
        {TIME_SLOTS.slice(0, 8).map((s) => (
          <Pressable key={s} style={[styles.timeChip, time === s && styles.timeChipActive]} onPress={() => setTime(s)}>
            <Text style={[typography.captionMedium, time === s && { color: colors.white }]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <Input
        label={t('booking.describeIssue')}
        value={issue}
        onChangeText={setIssue}
        placeholder={t('booking.issuePlaceholder')}
        multiline
      />
      <Input
        label={t('booking.address')}
        value={address}
        onChangeText={setAddress}
        icon={<MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.textMuted} />}
      />

      {/* Price summary */}
      <Text style={[typography.h3, styles.label]}>{t('booking.priceSummary')}</Text>
      <Card>
        <Row label={t('booking.basePrice')} value={formatINR(worker.price)} />
        <Row label={t('booking.coopFee')} value={`+ ${formatINR(coopFee)}`} muted note="fair wage & welfare" />
        <View style={styles.divider} />
        <Row label={t('booking.estimatedTotal')} value={formatINR(total)} bold />
      </Card>

      <CoopCallout
        style={styles.callout}
        icon="hand-coin"
        title={t('onboard.fairWages')}
        note="8% cooperative fee supports worker insurance & welfare, not platform profit."
      />

      <Button title={t('booking.confirmBooking')} onPress={confirm} size="lg" style={{ marginTop: spacing.lg }} />

      {/* Success modal */}
      <Modal visible={showSuccess} onClose={() => setShowSuccess(false)} title="">
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check" size={40} color={colors.white} />
          </View>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>{t('booking.requestSent')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
            {t('booking.requestSentNote', { name: worker.name })}
          </Text>
          <Button title={t('booking.viewBookings')} onPress={() => { setShowSuccess(false); router.replace('/(customer)/bookings'); }} style={{ marginTop: spacing.xl }} />
          <Button title={t('booking.stayOn')} variant="ghost" onPress={() => setShowSuccess(false)} />
        </View>
      </Modal>
    </Screen>
  );
}

function Row({ label, value, muted, bold, note }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, bold && typography.bodyBold, muted && { color: colors.textSecondary }]}>{label}</Text>
        {note ? <Text style={[typography.small, { color: colors.success }]}>{note}</Text> : null}
      </View>
      <Text style={[typography.bodyBold, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  label: { marginTop: spacing.xl, marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateTextActive: { color: colors.white },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  callout: { marginTop: spacing.lg },
  successWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});