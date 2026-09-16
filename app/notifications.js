import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, EmptyState } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';
import { useNotificationsStore } from '../src/store/notificationsStore';
import { useBookingStore } from '../src/store/bookingStore';
import { useChatStore } from '../src/store/chatStore';
import { useAuthStore } from '../src/store/authStore';
import { t } from '../src/i18n';
import { useSettingsStore } from '../src/store/settingsStore';

// Map notification status to icon + color
const ICON_STYLE = {
  notifications_newRequest:   { icon: 'bell-ring-outline',  color: colors.warning },
  notifications_confirmed:    { icon: 'check-decagram-outline', color: colors.success },
  notifications_inProgress:   { icon: 'progress-wrench',     color: colors.info },
  notifications_completed:    { icon: 'check-circle-outline', color: colors.success },
  notifications_cancelled:    { icon: 'close-circle-outline', color: colors.danger },
  notifications_payment:      { icon: 'currency-inr',         color: colors.primary },
  notifications_rated:        { icon: 'star-outline',          color: colors.star },
  notifications_tagAccepted:  { icon: 'account-group-outline', color: colors.info },
  notifications_tagShared:    { icon: 'star-shooting-outline', color: colors.star },
  notifications_tagRequest:   { icon: 'account-plus-outline',  color: colors.primary },
  'notifications.emergencyAccepted': { icon: 'alarm-light',    color: colors.danger },
};

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const items = useNotificationsStore((s) => s.items);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const refresh = useNotificationsStore((s) => s.refresh);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const markRead = useNotificationsStore((s) => s.markRead);

  useEffect(() => {
    refresh(user?.id, user?.role);
    // Re-derive whenever the live booking store changes (syncStore poll).
    const unsubBookings = useBookingStore.subscribe(() => refresh(user?.id, user?.role));
    const unsubChat = useChatStore.subscribe(() => refresh(user?.id, user?.role));
    return () => {
      unsubBookings();
      unsubChat();
    };
  }, [user?.id]);

  const handlePress = (item) => {
    markRead(item.id);
  };

  const handleClearAll = () => {
    markAllRead();
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h2, { color: colors.text }]}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <Text style={[typography.caption, { color: colors.primary }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={[typography.smallBold, { color: colors.primary }]}>{t('notifications.markAllRead')}</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState icon="bell-outline" title={t('notifications.empty')} note={t('notifications.emptyNote')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => {
            const isRead = useNotificationsStore.getState().readIds[item.id];
            const style = ICON_STYLE[item.title] || { icon: 'bell-outline', color: colors.textMuted };
            return (
              <Pressable
                style={[styles.row, isRead && styles.rowRead]}
                onPress={() => handlePress(item)}
              >
                <View style={[styles.iconWrap, { backgroundColor: style.color + '18' }]}>
                  <MaterialCommunityIcons name={style.icon} size={20} color={style.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, isRead && { color: colors.textSecondary }]}>
                    {t(item.title)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                    {relativeTime(item.time)}
                  </Text>
                </View>
                {!isRead && <View style={styles.unreadDot} />}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRight: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  clearBtn: {
    marginLeft: 'auto',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
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
  rowRead: {
    opacity: 0.65,
    backgroundColor: colors.background,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
