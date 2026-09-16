// MentorCard — one row of the "Tag along" mentor discovery screen. Renders a
// catalogue worker's face/name/service/rating/distance and a trailing action
// that reflects the CURRENT tag-along state between THIS phone (a new worker)
// and that mentor, read live from tagAlongStore.
//
// States: none → "Take me along" · pending → "Request sent ✓" · accepted →
// "Active" · completed → "⭐ Shared" (+ rating) · rejected → "Declined".

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { getService } from '../../data/services';
import { RatingBubble } from '../ui';
import { useTagAlongStore } from '../../store/tagAlongStore';
import { useAuthStore } from '../../store/authStore';
import { t } from '../../i18n';

export default function MentorCard({ worker, myService }) {
  const styles = makeStyles(colors);
  const myId = useAuthStore((s) => s.user?.id);
  const pair = useTagAlongStore((s) => s.rows.find((r) => r.mentorId === worker.id && r.juniorId === myId));
  const service = getService(worker.service);
  const sameService = myService && myService === worker.service;

  const onRequest = async () => {
    await useTagAlongStore
      .getState()
      .requestMentor({
        juniorId: myId,
        juniorName: useAuthStore.getState().user?.name || 'New member',
        mentorId: worker.id,
        mentorName: worker.name,
        service: worker.service,
      });
  };

  let action;
  if (!pair) {
    action = (
      <Pressable style={styles.actionBtn} onPress={onRequest}>
        <Text style={[typography.captionMedium, { color: colors.white }]}>{t('tagAlong.takeMeAlong')}</Text>
      </Pressable>
    );
  } else if (pair.status === 'pending') {
    action = (
      <View style={styles.actionPill}>
        <MaterialCommunityIcons name="check" size={14} color={colors.success} />
        <Text style={[typography.captionMedium, { color: colors.success }]}>{t('tagAlong.requestSent')}</Text>
      </View>
    );
  } else if (pair.status === 'accepted') {
    action = (
      <View style={[styles.actionPill, styles.actionActive]}>
        <MaterialCommunityIcons name="flash" size={14} color={colors.white} />
        <Text style={[typography.captionMedium, { color: colors.white }]}>{t('tagAlong.active')}</Text>
      </View>
    );
  } else if (pair.status === 'completed') {
    action = (
      <View style={styles.actionPill}>
        <MaterialCommunityIcons name="star" size={14} color={colors.star} />
        <Text style={[typography.captionMedium, { color: colors.star }]}>
          {pair.rating != null ? `${pair.rating}★` : t('tagAlong.shared')}
        </Text>
      </View>
    );
  } else {
    action = (
      <View style={styles.actionPill}>
        <Text style={[typography.captionMedium, { color: colors.textMuted }]}>{t('tagAlong.declined')}</Text>
      </View>
    );
  }

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.avatar, { backgroundColor: service.color + '22' }]}>
        <Text style={styles.emoji}>{worker.avatar}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={[typography.bodyBold, { color: colors.text, flexShrink: 1 }]}>
            {worker.name}
          </Text>
          {sameService ? (
            <View style={styles.matchTag}>
              <Text style={[typography.small, { color: colors.primaryDark, fontWeight: '700' }]}>
                {t('tagAlong.sameService')}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t(`categories.${worker.service}`)} • {worker.yearsExp} yrs
        </Text>
        <View style={styles.metaRow}>
          <RatingBubble rating={worker.rating} count={worker.reviewsCount} />
          <Text style={[typography.small, { color: colors.textMuted }]}>{worker.distance} {t('home.kmAway')}</Text>
        </View>
      </View>

      <View style={styles.right}>{action}</View>
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.92 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 25 },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchTag: { backgroundColor: colors.accentLight, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  right: { alignItems: 'flex-end' },
  actionBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actionActive: { backgroundColor: colors.accent, borderColor: colors.accent },
});