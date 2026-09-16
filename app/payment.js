import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Card } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';
import { formatINR } from '../src/utils/format';
import { useBookingStore } from '../src/store/bookingStore';
import { t } from '../src/i18n';

const METHODS = [
  { key: 'upi', icon: 'qrcode-scan', color: '#6C5CE7' },
  { key: 'card', icon: 'credit-card-outline', color: '#2E7BB0' },
  { key: 'cash', icon: 'cash-multiple', color: '#1E9E5A' },
];

export default function PaymentScreen() {
  const styles = makeStyles(colors);
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const booking = useBookingStore((s) => s.bookings.find((b) => b.id === bookingId));
  const setPayment = useBookingStore((s) => s.setPayment);

  const [method, setMethod] = useState('upi');
  const [phase, setPhase] = useState('select'); // select | processing | success

  if (!booking) {
    return (
      <Screen>
        <Text style={[typography.h2, { textAlign: 'center', marginTop: 80 }]}>Booking not found</Text>
      </Screen>
    );
  }

  const total = booking.amount + booking.coopFee;

  const pay = async () => {
  const styles = makeStyles(colors);
    setPhase('processing');
    setTimeout(async () => {
      await setPayment(booking.id, method);
      setPhase('success');
    }, 1800);
  };

  return (
    <Screen scroll={phase === 'select'}>
      <View style={styles.topBar}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('payment.title')}</Text>
      </View>

      {phase === 'select' && (
        <>
          <Card style={styles.summary}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{t('booking.date')}: {booking.date}</Text>
            <Text style={[typography.h3, { color: colors.text }]}>{booking.issue}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
              <Text style={typography.body}>{t('booking.total')}</Text>
              <Text style={[typography.h3, { color: colors.text }]}>{formatINR(total)}</Text>
            </View>
          </Card>

          <Text style={[typography.h3, styles.label]}>{t('payment.selectMethod')}</Text>
          {METHODS.map((m) => {
            const selected = method === m.key;
            return (
              <Pressable key={m.key} style={[styles.method, selected && styles.methodActive]} onPress={() => setMethod(m.key)}>
                <View style={[styles.methodIcon, { backgroundColor: `${m.color}18` }]}>
                  <MaterialCommunityIcons name={m.icon} size={22} color={m.color} />
                </View>
                <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>
                  {t(`payment.${m.key}Label`)}
                  {m.key === 'upi' ? '  •  anita@okhdfc' : m.key === 'card' ? '  ••  •••• 4532' : ''}
                </Text>
                <View style={[styles.radio, selected && styles.radioActive]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}

          <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg }]}>
            🔒 {t('payment.demoNote')}
          </Text>

          <Button title={t('payment.payAmount', { amount: formatINR(total) })} size="lg" onPress={pay} style={{ marginTop: spacing.xl }} />
        </>
      )}

      {phase === 'processing' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.lg }]}>{t('payment.paying')}</Text>
        </View>
      )}

      {phase === 'success' && (
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check" size={48} color={colors.white} />
          </View>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>{t('payment.success')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
            {t('payment.successNote')}
          </Text>

          <Card style={styles.receipt}>
            <ReceiptRow label={t('payment.transactionId')} value={`TXN${Math.random().toString(36).slice(2, 10).toUpperCase()}`} />
            <ReceiptRow label={t('payment.amountPaid')} value={formatINR(total)} />
            <ReceiptRow label={t('payment.method')} value={method.toUpperCase()} />
          </Card>

          <Button title={t('payment.done')} size="lg" onPress={() => router.replace(booking.customerId ? '/(customer)/bookings' : '/(worker)')} />
        </View>
      )}
    </Screen>
  );
}

function ReceiptRow({ label, value }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.receiptRow}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.captionMedium, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  topBar: { marginTop: spacing.md, marginBottom: spacing.lg },
  summary: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.md },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl * 2, gap: spacing.md },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  receipt: { width: '100%', marginTop: spacing.lg, marginBottom: spacing.xl, gap: spacing.sm },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
