import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../src/components/ui';
import { colors, radius, spacing, typography } from '../../src/theme';
import { t } from '../../src/i18n';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';

const ROLES = [
  { role: 'customer', icon: 'home-heart', color: colors.primary, title: 'asCustomer', desc: 'customerDesc' },
  { role: 'worker', icon: 'account-wrench', color: '#2E7BB0', title: 'asWorker', desc: 'workerDesc' },
];

export default function RoleSelectScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const router = useRouter();

  const choose = async (role) => {
  const styles = makeStyles(colors);
    await useAuthStore.getState().updateProfile({ role });
    router.replace(role === 'worker' ? '/(worker)' : '/(customer)');
  };

  return (
    <Screen>
      <View style={styles.top}>
        <MaterialCommunityIcons name="handshake" size={34} color={colors.primary} />
        <Text style={[typography.h1, { color: colors.text, textAlign: 'center' }]}>{t('auth.selectRole')}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>{t('auth.selectRoleSub')}</Text>
      </View>

      <View style={styles.list}>
        {ROLES.map((r) => (
          <Pressable key={r.role} onPress={() => choose(r.role)} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <View style={[styles.iconWrap, { backgroundColor: `${r.color}18` }]}>
              <MaterialCommunityIcons name={r.icon} size={30} color={r.color} />
            </View>
            <View style={styles.optionText}>
              <Text style={[typography.h3, { color: colors.text }]}>{t(`auth.${r.title}`)}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{t(`auth.${r.desc}`)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  top: { alignItems: 'center', gap: 8, paddingTop: spacing.xxxl, marginBottom: spacing.xxl },
  list: { gap: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.9 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, gap: 2 },
});
