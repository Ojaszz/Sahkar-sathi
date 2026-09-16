import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Input, Header } from '../../src/components/ui';
import { colors, spacing, typography } from '../../src/theme';
import { t } from '../../src/i18n';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const styles = makeStyles(colors);
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', location: '', phone: '' });

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
  const styles = makeStyles(colors);
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    // Demo: create the account and take to role selection
    await useAuthStore.getState().login({
      id: 'cust_new',
      name: form.name.trim(),
      phone: form.phone || '+91 00000 00000',
      email: form.email,
      role: 'customer',
      location: form.location || 'Pune',
      avatar: '👤',
    });
    router.replace('/auth/role-select');
  };

  return (
    <Screen>
      <Header title={t('auth.register')} />
      <Text style={[typography.h2, styles.title]}>{t('auth.selectRoleSub')}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
        Create your Sahkar Sathi account to get started.
      </Text>

      <Input label={t('auth.fullName')} value={form.name} onChangeText={set('name')} placeholder="e.g. Anita Deshmukh" icon={<MaterialCommunityIcons name="account-outline" size={20} color={colors.textMuted} />} />
      <Input label={t('auth.phoneNumber')} value={form.phone} onChangeText={set('phone')} placeholder="10-digit mobile number" keyboardType="phone-pad" icon={<MaterialCommunityIcons name="phone-outline" size={20} color={colors.textMuted} />} />
      <Input label={t('auth.email')} value={form.email} onChangeText={set('email')} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" icon={<MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} />} />
      <Input label={t('auth.location')} value={form.location} onChangeText={set('location')} placeholder="e.g. FC Road, Pune" icon={<MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.textMuted} />} />

      <Button title={t('auth.createAccount')} onPress={submit} />
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.xs },
});