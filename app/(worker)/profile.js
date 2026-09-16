import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Card, Badge, StatusBadge } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { ProfileMenu, MenuItem, MenuGroup } from '../../src/components/profile/SettingsPanel';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useBookingStore } from '../../src/store/bookingStore';
import { useTagAlongStore } from '../../src/store/tagAlongStore';
import { getWorker, isKnownWorker } from '../../src/data/workers';
import { formatINR } from '../../src/utils/format';
import { ratingSnapshot } from '../../src/utils/ratings';
import { INSURANCE_POLICIES, TAG_ALONG_LIMIT } from '../../src/utils/constants';
import { t } from '../../src/i18n';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function WorkerProfile() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingStore((s) => s.bookings);
  const workerId = user?.id || 'w1';
  const catalog = isKnownWorker(user?.id) ? getWorker(user?.id) : null;
  const worker = catalog || {
    service: '',
    rating: 0,
    available: true,
    memberSince: new Date().getFullYear(),
    insuranceCover: '₹5,00,000 life cover • Accident • Hospitalisation',
  };
  const my = bookings.filter((b) => b.workerId === workerId);
  const completed = my.filter((b) => b.status === 'completed').length;
  const sharedRows = useTagAlongStore((s) => s.rows);
  const snapshot = !catalog ? ratingSnapshot(user?.id, my, sharedRows) : null;
  const myRows = sharedRows.filter((r) => r.juniorId === user?.id);
  const myDone = myRows.filter((r) => r.status === 'completed').length;
  const graduated = !catalog && myDone >= TAG_ALONG_LIMIT;

  return (
    <Screen>
      {/* Profile header */}
      <View style={styles.header}>
        <Avatar emoji={user?.avatar || '👨‍🔧'} size={76} online style={styles.avatar} />
        <Text style={[typography.h1, { color: colors.text }]}>{user?.name || worker.name}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {catalog ? t(`categories.${catalog.service}`) : t('worker.newMember')}{' • '}
          {t('worker.memberSince', { year: worker.memberSince })}
        </Text>
        <View style={styles.badgeRow}>
          <Badge label={t('worker.verifiedBadge')} color={colors.success} />
          <Badge label={t('worker.fairWage')} color={colors.accent} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatBox label={t('workerApp.jobsDone')} value={completed} />
        <StatBox label={t('worker.rating')} value={snapshot?.count ? `${snapshot.avg}★` : catalog ? worker.rating.toFixed(1) : '0.0★'} />
        <StatBox label={t('workerApp.available')} value={worker.available ? t('common.yes') : t('common.no')} />
      </View>

      {/* My tag-along journey — registered workers only */}
      {!catalog && myRows.length > 0 ? (
        <Card style={styles.alongCard}>
          <View style={styles.alongHead}>
            <MaterialCommunityIcons name="account-group" size={20} color={colors.accent} />
            <Text style={[typography.bodyBold, { color: colors.text }]}>{t('tagAlong.myTagAlongs')}</Text>
            {!graduated ? (
              <Badge label={t('tagAlong.limitOf', { done: myDone, limit: TAG_ALONG_LIMIT })} color={colors.accent} />
            ) : (
              <Badge label={t('tagAlong.graduated')} color={colors.success} />
            )}
          </View>
          {myRows.map((r) => (
            <View key={r.id} style={styles.alongRow}>
              <Avatar emoji="🧑‍🔧" size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.captionMedium, { color: colors.text }]}>{r.mentorName || t('worker.mentor')}</Text>
                <Text style={[typography.small, { color: colors.textMuted }]}>
                  {r.status === 'pending' ? t('tagAlong.requestSent')
                    : r.status === 'accepted' ? t('tagAlong.active')
                    : r.status === 'completed' ? (r.rating != null ? `${r.rating}★` : t('tagAlong.shared'))
                    : t('tagAlong.declined')}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
            </View>
          ))}
          {!graduated ? (
            <Pressable style={styles.alongMore} onPress={() => router.push('/(worker)/tagalong')}>
              <Text style={[typography.captionMedium, { color: colors.accent }]}>{t('tagAlong.findMentor')}</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={colors.accent} />
            </Pressable>
          ) : null}
        </Card>
      ) : null}
      {!catalog && myRows.length === 0 ? (
        <Pressable style={styles.alongEmpty} onPress={() => router.push('/(worker)/tagalong')}>
          <View style={styles.tagEmptyIcon}>
            <MaterialCommunityIcons name="account-group" size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.captionMedium, { color: colors.text }]}>{t('tagAlong.myTagAlongs')}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('tagAlong.dashZero')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}

      {/* My services & areas — registered workers (from onboarding) */}
      {!catalog && (user?.service || user?.serviceAreas?.length) ? (
        <Card style={styles.servicesCard}>
          <View style={styles.servicesHead}>
            <MaterialCommunityIcons name="briefcase-edit-outline" size={20} color={colors.accent} />
            <Text style={[typography.bodyBold, { color: colors.text }]}>{t('profile.myServices')}</Text>
          </View>

          <View style={styles.servicesField}>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('worker.services')}</Text>
            <Text style={[typography.captionMedium, { color: colors.text }]}>
              {user?.service ? t(`categories.${user.service}`) : t('common.notAvailable')}
            </Text>
          </View>

          {user?.skills?.length ? (
            <View style={styles.servicesField}>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('worker.skills')}</Text>
              <ChipRow values={user.skills} />
            </View>
          ) : null}

          {user?.certifications?.length ? (
            <View style={styles.servicesField}>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('worker.certifications')}</Text>
              <ChipRow values={user.certifications} />
            </View>
          ) : null}

          {user?.serviceAreas?.length ? (
            <View style={styles.servicesField}>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('workerApp.serviceArea')}</Text>
              <ChipRow values={user.serviceAreas} />
            </View>
          ) : null}

          <View style={styles.servicesField}>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('worker.languages')}</Text>
            <Text style={[typography.captionMedium, { color: colors.text }]}>
              {user?.languages?.length ? user.languages.join(' · ') : t('common.notAvailable')}
            </Text>
          </View>

          {user?.experienceYears ? (
            <View style={styles.servicesField}>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('worker.experience')}</Text>
              <Text style={[typography.captionMedium, { color: colors.text }]}>{user.experienceYears}</Text>
            </View>
          ) : null}

          {user?.rate ? (
            <View style={styles.servicesField}>
              <Text style={[typography.small, { color: colors.textMuted }]}>{t('onboarding.rateLabel')}</Text>
              <Text style={[typography.captionMedium, { color: colors.text }]}>
                {formatINR(user.rate)}<Text style={{ color: colors.textMuted }}>/hr</Text>
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* Insurance & welfare — core differentiator */}
      <Text style={[typography.h3, styles.section]}>{t('profile.insurance')}</Text>
      <Card style={styles.insuranceCard}>
        <View style={styles.insuranceHeader}>
          <MaterialCommunityIcons name="shield-check" size={26} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold}>{t('worker.groupInsurance')}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {worker.insuranceCover}
            </Text>
          </View>
          <StatusBadge status="confirmed" label={t('common.active')} />
        </View>
        <View style={styles.divider} />
        {INSURANCE_POLICIES.map((p) => (
          <View key={p.name} style={styles.policyRow}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.captionMedium, { color: colors.text }]}>{p.name}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{p.detail}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Coop contribution transparency */}
      <Card style={styles.coopCard}>
        <View style={styles.coopRow}>
          <MaterialCommunityIcons name="hand-coin" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.captionMedium, { color: colors.accent }]}>{t('worker.fairWageShare')}</Text>
            <Text style={[typography.small, { color: colors.text, opacity: 0.85 }]}>
              {t('worker.fairWageSplit')}
            </Text>
          </View>
        </View>
      </Card>

      {/* Menu */}
      <ProfileMenu user={user} />
    </Screen>
  );
}

function ChipRow({ values }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.chipRowWrap}>
      {(values || []).map((v) => (
        <View key={v} style={styles.chip}>
          <Text style={[typography.small, { color: colors.text }]}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function StatBox({ label, value }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.statBox}>
      <Text style={[typography.h3, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.small, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { alignItems: 'center', paddingTop: spacing.xl, gap: 5, marginBottom: spacing.lg },
  avatar: { borderWidth: 3, borderColor: '#2E7BB0', marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 2,
  },
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  insuranceCard: { marginBottom: spacing.md },
  insuranceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  policyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.sm },
  coopCard: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accentLight,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  coopRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  servicesCard: { marginBottom: spacing.md },
  alongCard: { marginBottom: spacing.md },
  alongHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  alongRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  alongMore: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md, justifyContent: 'center' },
  alongEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.accentLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  tagEmptyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  servicesHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  servicesField: { gap: 4, marginTop: spacing.sm },
  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
});