import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Input, CoopCallout } from '../../src/components/ui';
import { colors, spacing, radius, typography } from '../../src/theme';
import { t } from '../../src/i18n';
import { DEMO_OTP } from '../../src/utils/constants';
import { WORKERS } from '../../src/data/workers';
import { useAuthStore } from '../../src/store/authStore';
import { useSyncStore } from '../../src/store/syncStore';
import { useSettingsStore } from '../../src/store/settingsStore';

// The demo worker "bin" you can log in as instantly during the judge demo —
// exactly the five catalogue members.
const DEMO_WORKER_IDS = ['w1', 'w2', 'w3', 'w4', 'w5'];

export default function LoginScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const router = useRouter();
  const [who, setWho] = useState('user'); // user | worker — two login pages, same form
  const [mode, setMode] = useState('email'); // email | phone
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('phone'); // phone | otp
  const [busy, setBusy] = useState(false);
  const [showWorkers, setShowWorkers] = useState(false);

  const sendOtp = () => {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert(t('auth.checkNumberTitle'), t('auth.checkNumberMsg'));
      return;
    }
    setStep('otp');
  };

  const verify = () => {
    if (otp === DEMO_OTP) {
      router.push('/auth/role-select');
    } else {
      Alert.alert(t('auth.incorrectOtpTitle'), t('auth.incorrectOtpMsg'));
    }
  };

  const demoLogin = async (role) => {
    useSyncStore.getState().init();
    await useAuthStore.getState().loginAsDemo(role);
    router.replace(role === 'worker' ? '/(worker)' : '/(customer)');
  };

  // Instant login as one of the demo workers (real name + service shown).
  const demoWorkerLogin = async (w) => {
    if (busy) return;
    setBusy(true);
    try {
      useSyncStore.getState().init();
      await useAuthStore.getState().loginAsDemoWorker(w);
      router.replace('/(worker)');
    } finally {
      setBusy(false);
    }
  };

  const demoWorkers = DEMO_WORKER_IDS.map((id) => WORKERS.find((w) => w.id === id)).filter(Boolean);

  const emailSignIn = async () => {
    if (busy) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert(t('auth.checkEmailTitle'), t('auth.checkEmailMsg'));
      return;
    }
    if (password.length < 1) {
      Alert.alert(t('auth.passwordRequiredTitle'), t('auth.passwordRequiredMsg'));
      return;
    }
    setBusy(true);
    try {
      const user = await useAuthStore.getState().supabaseSignIn(email.trim(), password);
      // Keep the two tabs honest: only customer accounts may use the User tab,
      // only worker accounts the Worker tab. Undo the session + explain on mismatch.
      const isWorker = user.role === 'worker';
      if (who === 'user' && isWorker) {
        await useAuthStore.getState().logout();
        Alert.alert(t('auth.roleMismatch'), t('auth.roleWorkerTab'));
        return;
      }
      if (who === 'worker' && !isWorker) {
        await useAuthStore.getState().logout();
        Alert.alert(t('auth.roleMismatch'), t('auth.roleUserTab'));
        return;
      }
      // Route to the page the person picked on top: User tab → customer app,
      // Worker tab → worker app.
      router.replace(isWorker ? '/(worker)' : user.role === 'admin' ? '/(admin)' : '/(customer)');
    } catch (e) {
      Alert.alert(t('auth.signInFailed'), String((e && e.message) || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll style={{ backgroundColor: colors.primaryLighter }}>
      <View style={styles.top}>
        <View style={styles.logoWrap}>
          <MaterialCommunityIcons name="handshake" size={40} color={colors.white} />
        </View>
        <Text style={[typography.h1, { color: colors.text }]}>{t('appName')}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('appTagline')}</Text>
      </View>

      {/* User | Worker toggle — separate login pages, same form underneath */}
      <View style={styles.modeRow}>
        <Pressable style={[styles.modeTab, who === 'user' && styles.modeTabActive]} onPress={() => setWho('user')}>
          <MaterialCommunityIcons name="account" size={16} color={who === 'user' ? colors.white : colors.textMuted} />
          <Text style={[typography.captionMedium, { color: who === 'user' ? colors.white : colors.text }]}>{t('auth.userLogin')}</Text>
        </Pressable>
        <Pressable style={[styles.modeTab, who === 'worker' && styles.modeTabActive]} onPress={() => setWho('worker')}>
          <MaterialCommunityIcons name="account-wrench" size={16} color={who === 'worker' ? colors.white : colors.textMuted} />
          <Text style={[typography.captionMedium, { color: who === 'worker' ? colors.white : colors.text }]}>{t('auth.workerLogin')}</Text>
        </Pressable>
      </View>

      {/* Email | Mobile toggle */}
      <View style={styles.modeRow}>
        <Pressable style={[styles.modeTab, mode === 'email' && styles.modeTabActive]} onPress={() => setMode('email')}>
          <MaterialCommunityIcons name="email-outline" size={16} color={mode === 'email' ? colors.white : colors.textMuted} />
          <Text style={[typography.captionMedium, { color: mode === 'email' ? colors.white : colors.text }]}>{t('auth.email')}</Text>
        </Pressable>
        <Pressable style={[styles.modeTab, mode === 'phone' && styles.modeTabActive]} onPress={() => setMode('phone')}>
          <MaterialCommunityIcons name="cellphone" size={16} color={mode === 'phone' ? colors.white : colors.textMuted} />
          <Text style={[typography.captionMedium, { color: mode === 'phone' ? colors.white : colors.text }]}>{t('auth.mobileTab')}</Text>
        </Pressable>
      </View>

      {mode === 'phone' && step === 'phone' ? (
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
      ) : null}

      {mode === 'phone' && step === 'otp' ? (
        <View>
          <Text style={[typography.h2, styles.formTitle]}>{t('auth.enterOtp')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
            {t('auth.otpSent')} +91 {phone}
          </Text>
          <Input
            label={t('auth.otp')}
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
      ) : null}

      {mode === 'email' ? (
        <View>
          <Text style={[typography.h2, styles.formTitle]}>{t('auth.signInWithEmail')}</Text>
          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon={<MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} />}
          />
          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            icon={<MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} />}
          />
          <Button title={t('auth.signIn')} onPress={emailSignIn} disabled={busy} loading={busy} />
          <Pressable style={styles.registerLink} onPress={() => router.push('/auth/register')}>
            <Text style={typography.captionMedium}>
              {t('auth.alreadyHaveAccount')} <Text style={{ color: colors.accent }}>{t('auth.register')}</Text>
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={[typography.small, { color: colors.textMuted }]}>{t('auth.orContinue')}</Text>
        <View style={styles.line} />
      </View>

      {who === 'user' ? (
        <View style={styles.demoRow}>
          <DemoChip label={t('auth.demoCustomer')} role="customer" onPress={demoLogin} icon="home-account" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.demoRow}>
          <DemoChip label={t('auth.demoWorker')} role="worker" onPress={demoLogin} icon="account-wrench" color="#2E7BB0" />
        </View>
      )}

      {who === 'worker' ? (
        <Pressable style={styles.workersToggle} onPress={() => setShowWorkers((s) => !s)}>
          <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.accent} />
          <Text style={[typography.captionMedium, { color: colors.accent }]}>
            {`👷 ${t('auth.pickDemoWorker')}`}
          </Text>
          <MaterialCommunityIcons name={showWorkers ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
      {who === 'worker' && showWorkers ? (
        <View style={styles.workerList}>
          {demoWorkers.map((w) => (
            <Pressable
              key={w.id}
              style={styles.workerRow}
              onPress={() => demoWorkerLogin(w)}
              disabled={busy}
            >
              <Text style={styles.workerEmoji}>{w.avatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.body, { color: colors.text }]}>{w.name}</Text>
                <Text style={[typography.small, { color: colors.textSecondary }]}>
                  {t(`categories.${w.service}`)} • {w.rating}★ • {w.jobsCompleted} {t('workerApp.jobs')}
                </Text>
              </View>
              <MaterialCommunityIcons name="login" size={18} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : null}

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
  top: { alignItems: 'center', paddingTop: spacing.xxxl, marginBottom: spacing.xxl, gap: 6 },
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
  workersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  workerList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  workerEmoji: { fontSize: 24 },
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
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
  },
  modeTabActive: { backgroundColor: colors.primary },
});