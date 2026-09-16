import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { LANGUAGES, t } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

export function ProfileMenu({ user }) {
  const styles = makeStyles(colors);
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const language = useSettingsStore((s) => s.language);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const theme = useSettingsStore((s) => s.theme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const toggleNotifications = useSettingsStore((s) => s.toggleNotifications);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const logout = () => {
  const styles = makeStyles(colors);
    Alert.alert(t('profile.confirmLogout'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: async () => {
          await useAuthStore.getState().logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const switchRole = (role) => {
  const styles = makeStyles(colors);
    useAuthStore.getState().updateProfile({ role });
    router.replace(role === 'worker' ? '/(worker)' : '/(customer)');
  };

  const activeLang = LANGUAGES.find((l) => l.code === language);

  return (
    <>
      <MenuGroup>
        <MenuItem icon="translate" label={t('profile.language')} note={`${activeLang?.flag} ${activeLang?.native}`} onPress={() => setLangOpen(true)} />
        <MenuItem
          icon="bell-outline"
          label={t('profile.notifications')}
          note={t('profile.notificationNote')}
          right={<Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: colors.primary, false: colors.border }} />}
        />
        <MenuItem
          icon={theme === 'dark' ? 'weather-night' : 'white-balance-sunny'}
          label={t('profile.darkMode')}
          note={theme === 'dark' ? t('profile.darkOn') : t('profile.darkOff')}
          right={<Switch value={theme === 'dark'} onValueChange={(v) => setTheme(v ? 'dark' : 'light')} trackColor={{ true: colors.primary, false: colors.border }} />}
        />
        {user?.isDemo ? (
          <MenuItem icon="sync" label={t('profile.switchRole')} note={t('profile.switchRoleNote')} onPress={() => switchRole(user?.role === 'customer' ? 'worker' : 'customer')} />
        ) : null}
        <MenuItem icon="alert-decagram" label={t('profile.emergency')} onPress={() => router.push('/emergency')} />
        <MenuItem icon="map-marker-outline" label={t('profile.savedAddresses')} note={t('profile.homeAddrNote')} onPress={() => router.push('/addresses')} />
        <MenuItem icon="help-circle-outline" label={t('profile.help')} onPress={() => router.push('/help')} />
        {user?.role === 'worker' ? (
          <MenuItem icon="shield-check-outline" label={t('profile.insurance')} onPress={() => router.push('/(worker)/profile')} />
        ) : null}
        {user?.role === 'worker' ? (
          <MenuItem
            icon="briefcase-edit-outline"
            label={t('profile.myServices')}
            note={t('tagAlong.editServicesNote')}
            onPress={() => router.push('/worker-onboarding')}
          />
        ) : null}
      </MenuGroup>

      <MenuGroup>
        <MenuItem icon="information-outline" label={t('profile.about')} note={t('profile.versionNote')} onPress={() => null} />
        <MenuItem icon="logout" label={t('profile.logout')} color={colors.danger} onPress={logout} />
      </MenuGroup>

      <Text style={[typography.small, styles.footerNote]}>
        सहकार साथी — a member-owned cooperative marketplace. 🛠️
      </Text>

      {/* Language modal */}
      <Modal visible={langOpen} onClose={() => setLangOpen(false)} title={t('profile.language')}>
        {LANGUAGES.map((l) => (
          <Pressable key={l.code} style={[styles.langRow, language === l.code && styles.langRowActive]} onPress={() => { setLanguage(l.code); setLangOpen(false); }}>
            <Text style={{ fontSize: 22 }}>{l.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{l.native}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{l.label}</Text>
            </View>
            {language === l.code ? <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} /> : null}
          </Pressable>
        ))}
      </Modal>
    </>
  );
}

export function MenuGroup({ children }) {
  const styles = makeStyles(colors);
  return <View style={styles.group}>{children}</View>;
}

export function MenuItem({ icon, label, note, onPress, right, color = colors.text }) {
  const styles = makeStyles(colors);
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <View style={[styles.itemIcon, { backgroundColor: `${color}14` }]}>
        <MaterialCommunityIcons name={icon} size={19} color={color} />
      </View>
      <View style={styles.itemText}>
        <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
        {note ? <Text style={[typography.small, { color: colors.textMuted }]}>{note}</Text> : null}
      </View>
      {right || <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />}
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  itemIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, gap: 1 },
  footerNote: { textAlign: 'center', color: colors.textMuted, marginVertical: spacing.lg },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  langRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
});
