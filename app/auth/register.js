import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Input, Header, AreaPicker } from '../../src/components/ui';
import { colors, spacing, radius, typography } from '../../src/theme';
import { t } from '../../src/i18n';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';

const ROLES = [
  { key: 'customer', labelKey: 'auth.roleCustomer', icon: 'home-account' },
  { key: 'worker', labelKey: 'auth.roleWorker', icon: 'account-wrench' },
];

export default function RegisterScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', location: 'FC Road', phone: '' });
  const [role, setRole] = useState('customer');
  const [busy, setBusy] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (busy) return;
    if (!form.name.trim()) {
      Alert.alert(t('auth.nameRequiredTitle'), t('auth.nameRequiredMsg'));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      Alert.alert(t('auth.emailRequiredTitle'), t('auth.emailRequiredMsg'));
      return;
    }
    if (form.password.length < 6) {
      Alert.alert(t('auth.passwordShortTitle'), t('auth.passwordShortMsg'));
      return;
    }
    setBusy(true);
    try {
      const user = await useAuthStore.getState().supabaseSignUp({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        role,
        location: form.location.trim() || 'Pune',
        phone: form.phone || '',
      });
      router.replace(user.role === 'worker' ? '/(worker)' : user.role === 'admin' ? '/(admin)' : '/(customer)');
    } catch (e) {
      Alert.alert(t('auth.signUpFailed'), String((e && e.message) || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={t('auth.register')} />
      <Text style={[typography.h2, styles.title]}>{t('auth.selectRoleSub')}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
        {t('auth.createAccountSub')}
      </Text>

      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <Pressable
            key={r.key}
            style={[styles.roleChip, role === r.key && styles.roleChipActive]}
            onPress={() => setRole(r.key)}
          >
            <MaterialCommunityIcons name={r.icon} size={16} color={role === r.key ? colors.white : colors.textMuted} />
            <Text style={[typography.small, { color: role === r.key ? colors.white : colors.text }]}>{t(r.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      <Input label={t('auth.fullName')} value={form.name} onChangeText={set('name')} placeholder={t('auth.namePlaceholder')} icon={<MaterialCommunityIcons name="account-outline" size={20} color={colors.textMuted} />} />
      <Input label={t('auth.email')} value={form.email} onChangeText={set('email')} placeholder={t('auth.emailPlaceholder')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" icon={<MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} />} />
      <Input label={t('auth.password')} value={form.password} onChangeText={set('password')} placeholder={t('auth.passwordMin')} secureTextEntry autoCapitalize="none" icon={<MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} />} />
      <Input label={t('auth.phoneNumber')} value={form.phone} onChangeText={set('phone')} placeholder={t('common.optional')} keyboardType="phone-pad" icon={<MaterialCommunityIcons name="phone-outline" size={20} color={colors.textMuted} />} />
      <AreaPicker
        label={t('auth.chooseArea')}
        value={form.location}
        onChange={(a) => set('location')(a)}
        placeholder={t('auth.selectArea')}
      />

      <Button title={t('auth.createAccount')} onPress={submit} disabled={busy} loading={busy} />
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.xs },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 4,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});