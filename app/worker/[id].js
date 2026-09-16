import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Badge, CoopCallout, RatingBubble, StarRow } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { colors, radius, spacing, typography } from '../../src/theme';
import { getService } from '../../src/data/services';
import { reviewsForWorker } from '../../src/data/reviews';
import { formatINR, formatDate } from '../../src/utils/format';
import { INSURANCE_POLICIES } from '../../src/utils/constants';
import { useChatStore } from '../../src/store/chatStore';
import { useAuthStore } from '../../src/store/authStore';
import { useWorkerStore } from '../../src/store/workerStore';
import { useWorkerDirectoryStore } from '../../src/store/workerDirectoryStore';
import { t } from '../../src/i18n';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function WorkerDetailScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const { id } = useLocalSearchParams();
  const router = useRouter();
  // Resolve BOTH the catalogue and registered-worker halves.
  const worker = useWorkerStore((s) => s.getWorker(id));
  useWorkerDirectoryStore((s) => s.profiles); // re-resolve when profiles land
  const service = getService(worker.service);
  const reviews = reviewsForWorker(worker.id);
  const user = useAuthStore((s) => s.user);

  const startChat = async () => {
  const styles = makeStyles(colors);
    const me = { id: user.id, name: user.name, role: 'customer' };
    useChatStore.getState().setCurrentUser(me);
    await useChatStore.getState().openConversation(user.id, worker.id);
    router.push('/(customer)/chat');
  };

  return (
    <Screen scroll={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroBg, { backgroundColor: service.color + '1A' }]} />
          <Avatar emoji={worker.avatar} size={84} online={worker.available} style={styles.heroAvatar} />
          <View style={styles.nameRow}>
            <Text style={[typography.h1, { color: colors.text }]}>{worker.name}</Text>
            <MaterialCommunityIcons name="shield-check" size={20} color={colors.success} />
          </View>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            {t(`categories.${worker.service}`)} • {expLabel(worker.yearsExp)}
          </Text>

          <View style={styles.badges}>
            <Badge label={t('worker.verifiedBadge')} color={colors.success} icon={<MaterialCommunityIcons name="shield-check" size={12} color={colors.success} />} />
            <Badge label={`${formatINR(worker.price)}/hr`} color={colors.primary} />
            {worker.available ? <Badge label={t('home.availableNow')} color={colors.success} /> : <Badge label={t('home.offline')} color={colors.textMuted} />}
          </View>

          <View style={styles.statsRow}>
            <Stat label={t('search.sortRating')} value={worker.rating.toFixed(1)} icon="star" color={colors.star} />
            <Stat label={t('worker.completeJobs', { count: '' })} value={worker.jobsCompleted} icon="check-decagram" color={colors.success} />
            <Stat label={t('home.nearYou')} value={`${worker.distance}km`} icon="map-marker" color={colors.info} />
          </View>
        </View>

        <View style={styles.body}>
          {/* Cooperative differentiator callout */}
          <CoopCallout
            icon="hand-coin"
            title={t('worker.fairWage')}
            note={t('worker.fairWageNote')}
            style={styles.callout}
          />

          {/* About */}
          <Section label={t('worker.about')}>
            <Text style={typography.body}>{worker.about}</Text>
          </Section>

          {/* Skills */}
          <Section label={t('worker.skills')}>
            <View style={styles.chipWrap}>
              {worker.skills.map((s) => (
                <View key={s} style={styles.skillChip}>
                  <MaterialCommunityIcons name="tag-outline" size={13} color={colors.accent} />
                  <Text style={[typography.captionMedium, { color: colors.primaryDark }]}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Certifications */}
          <Section label={t('worker.certifications')}>
            {worker.certifications.map((c) => (
              <View key={c} style={styles.certRow}>
                <MaterialCommunityIcons name="certificate-outline" size={18} color={colors.success} />
                <Text style={typography.body}>{c}</Text>
              </View>
            ))}
          </Section>

          {/* Insurance & welfare */}
          <Section label={t('worker.insurance')}>
            <View style={styles.insuranceRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.captionMedium, { color: colors.text }]}>{t('worker.insuranceCover')}: {worker.insuranceCover}</Text>
                <Text style={[typography.small, { color: colors.textMuted }]}>{INSURANCE_POLICIES.map((p) => p.name).join(' • ')}</Text>
              </View>
            </View>
          </Section>

          {/* Languages */}
          <Section label={t('worker.languages')}>
            <Text style={typography.body}>{worker.languages.join(', ')}</Text>
          </Section>

          {/* Reviews */}
          <Section label={`${t('worker.reviews')} (${reviews.length})`}>
            {reviews.length === 0 ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>{t('worker.noReviews')}</Text>
            ) : (
              reviews.map((r) => (
                <View key={r.name} style={styles.review}>
                  <View style={styles.reviewHeader}>
                    <Text style={[typography.bodyBold, { color: colors.text }]}>{r.name}</Text>
                    <StarRow rating={r.rating} size={13} />
                  </View>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>{r.text}</Text>
                  <Text style={[typography.small, styles.reviewDate]}>{r.date}</Text>
                </View>
              ))
            )}
          </Section>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.footer}>
        <Pressable style={styles.chatBtn} onPress={startChat}>
          <MaterialCommunityIcons name="message-text" size={22} color={colors.primary} />
        </Pressable>
        <Button
          title={`${t('worker.bookNow')} • ${formatINR(worker.price)}/hr`}
          disabled={!worker.available}
          onPress={() => router.push(`/booking/new?workerId=${worker.id}`)}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
  );
}

// Catalogue workers store a numeric year count; registered workers store the label
// they picked in onboarding ("1–3 years"). Render both without the " yrs" suffix
// when the label already carries it.
function expLabel(exp) {
  if (typeof exp === 'number') return `${exp} yrs`;
  if (typeof exp === 'string' && exp.includes('year')) return exp;
  return exp ? `${exp} yrs` : 'New member';
}

function Stat({ label, value, icon, color }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={[typography.bodyBold, { color: colors.text }]}>{value}</Text>
      <Text numberOfLines={1} style={[typography.small, { color: colors.textMuted }]}>{label || ''}</Text>
    </View>
  );
}

function Section({ label, children }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.section}>
      <Text style={[typography.h3, styles.sectionTitle]}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.lg, gap: 6 },
  heroBg: { position: 'absolute', top: -120, left: 0, right: 0, height: 260 },
  heroAvatar: { borderWidth: 3, borderColor: colors.white, marginBottom: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  stat: { alignItems: 'center', flex: 1, gap: 2 },
  body: { padding: spacing.lg, gap: spacing.sm },
  callout: { marginBottom: spacing.sm, marginTop: spacing.md },
  section: { marginTop: spacing.lg },
  sectionTitle: { marginBottom: spacing.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  insuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  review: { marginBottom: spacing.md, gap: 3 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewDate: { color: colors.textMuted },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chatBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});