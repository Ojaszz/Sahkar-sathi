import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, EmptyState } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';
import { useNotificationsStore } from '../src/store/notificationsStore';
import { useAuthStore } from '../src/store/authStore';
import { t } from '../src/i18n';

const ICON_BY_TITLE = {
  'New booking request': 'bell-ring',
  'Booking confirmed': 'check-decagram',
  'Service started': 'progress-wrench',
  'Service completed': 'check-circle-outline',
  'Booking cancelled': 'close-circle-outline',
  'Payment received': 'currency-inr',
};

export default function NotificationsScreen() {
  const styles = makeStyles(colors);
  const user = useAuthStore((s) => s.user);
  const items = useNotificationsStore((s) => s.items);
  const refresh = useNotificationsStore((s) => s.refresh);

  useEffect(() => {
    refresh(user?.id, user?.role);
  }, [user]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('notifications.title')}</Text>
        <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary} />
      </View>

      {items.length === 0 ? (
        <EmptyState icon="bell-outline" title={t('notifications.empty')} note={t('notifications.emptyNote')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name={ICON_BY_TITLE[item.title] || 'bell-outline'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{item.title}</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>{item.body}</Text>
                <Text style={[typography.small, { color: colors.textMuted }]}>{item.time}</Text>
              </View>
              <View style={styles.unreadDot} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});