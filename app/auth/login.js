import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Input, CoopCallout } from '../../src/components/ui';
import { colors, spacing, radius, typography } from '../../src/theme';
import { setLanguage, t } from '../../src/i18n';
import { DEMO_OTP } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const styles = makeStyles(colors);
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone'); // phone | otp
  const [otp, setOtp] = useState('');

  const sendOtp = () => {
  const styles = makeStyles(colors);
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Check your number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setStep('otp');
  };

  const verify = () => {
  const styles = makeStyles(colors);
    if (otp === DEMO_OTP) {
      router.push('/auth/role-select');
    } else {
      Alert.alert('Incorrect OTP', 'Use the demo OTP 123456.');
    }
  };

  const demoLogin = async (role) => {
  const styles = makeStyles(colors);
    await useAuthStore.getState().loginAsDemo(role);
  };

  return (
    <Screen scroll style={{ backgroundColor: colors.primaryLighter }}>
      <View style={styles.top}>
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons name="handshake" size={40} color={colors.white} />
        </View>
        <Text style={[typography.h1, { color: colors.primaryDark }]}>{t('appName')}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('appTagline')}</Text>
      </View>

      {step === 'phone' ? (
        <View>
          <Text style={[typography.h2, styles.formTitle]}>{t('auth.welcome')}</Text>
          <Input
            label={t('auth.phoneNumber')}
            placeholder={t('auth.enterPhone')}
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            maxLength={10}
            icon={<MaterialCommunityIcons name="phone" size={20} color={colors.textMuted} />}
          />
          <Button title={t('auth.continue')} onPress={sendOtp} />
          <Pressable style={styles.registerLink} onPress={() => router.push('/auth/register')}>
            <Text style={typography.captionMedium}>
              {t('auth.alreadyHaveAccount')} <Text style={{ color: colors.accent }}>{t('auth.register')}</Text>
            </Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <Text style={[typography.h2, styles.formTitle]}>{t('auth.enterOtp')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
            {t('auth.otpSent')} +91 {phone}
          </Text>
          <Input
            label="OTP"
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            hint={t('auth.useOtp')}
            style={{ letterSpacing: 12, fontSize: 22 }}
            inputStyle={{ fontSize: 22, letterSpacing: 12, textAlign: 'center' }}
          />
          <Button title={t('auth.verifyOtp')} onPress={verify} />
          <Pressable style={styles.registerLink} onPress={() => setStep('phone')}>
            <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>
              {t('auth.didntReceive')} <Text style={{ color: colors.accent }}>{t('auth.resend')}</Text>
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={[typography.small, { color: colors.textMuted }]}>{t('auth.orContinue')}</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.demoRow}>
        <DemoChip label={t('auth.demoCustomer')} role="customer" onPress={demoLogin} icon="home-account" color={colors.primary} />
        <DemoChip label={t('auth.demoWorker')} role="worker" onPress={demoLogin} icon="account-wrench" color="#2E7BB0" />
      </View>

      <CoopCallout style={{ marginTop: spacing.xxl }} title={t('onboard.cooperative')} note={t('onboard.cooperativeDesc')} />
    </Screen>
  );
}

function DemoChip({ label, role, onPress, icon, color }) {
  const styles = makeStyles(colors);
  return (
    <Pressable style={[styles.chip, { borderColor: color }]} onPress={() => onPress(role)}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={[typography.smallBold, { color }]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  top: { alignItems: 'center', paddingTop: spacing.xxxl, marginBottom: spacing.xxxl, gap: 6 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  formTitle: { marginBottom: spacing.lg },
  registerLink: { alignItems: 'center', paddingVertical: spacing.lg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  demoRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    minWidth: '30%',
  },
});
