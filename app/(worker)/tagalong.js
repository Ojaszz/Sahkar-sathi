// Tag along — a NEW worker (0★) picks an experienced catalogue worker to "take
// them along". When that mentor completes + gets rated on a job, the customer's
// rating is mirrored to the junior so their rating grows over time.
//
// Lists only verified senior mentors (status 'verified', rating >= 4.5,
// available), sorted nearest-first, same-service first. Tapping "Take me along"
// inserts a tag_alongs row AND seeds a chat message so both phones see a real,
// live thread in their Chat tab.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Card, SectionHeader, EmptyState } from '../../src/components/ui';
import MentorCard from '../../src/components/worker/MentorCard';
import { colors, radius, spacing, typography } from '../../src/theme';
import { WORKERS } from '../../src/data/workers';
import { TAG_ALONG_LIMIT } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';
import { useTagAlongStore } from '../../src/store/tagAlongStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { t } from '../../src/i18n';

export default function TagAlong() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const user = useAuthStore((s) => s.user);
  const myService = user?.service || '';
  const myId = user?.id;
  const done = useTagAlongStore((s) => s.rows.filter((r) => r.juniorId === myId && r.status === 'completed').length);
  const graduated = done >= TAG_ALONG_LIMIT;

  // Feature closed: this junior has completed the cap of shared jobs.
  if (graduated) {
    return (
      <Screen
        header={
          <View style={styles.head}>
            <Text style={[typography.h2, { color: colors.text }]}>{t('tagAlong.title')}</Text>
            <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>
              {t('tagAlong.subtitle')}
            </Text>
          </View>
        }
      >
        <Card style={styles.gradCard}>
          <View style={styles.gradRow}>
            <View style={styles.gradIcon}>
              <MaterialCommunityIcons name="school" size={30} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.text }]}>{t('tagAlong.graduated')}</Text>
              <Text style={[typography.small, { color: colors.textMuted }, { marginTop: 4 }]}>
                {t('tagAlong.graduatedNote')}
              </Text>
            </View>
          </View>
          <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
            {t('tagAlong.gradContinue')}
          </Text>
        </Card>
      </Screen>
    );
  }

  // Senior mentors only: verified, top-rated, currently available.
  const mentors = WORKERS.filter(
    (w) => w.status === 'verified' && w.rating >= 4.5 && w.available
  ).sort((a, b) => {
    const aSame = a.service === myService ? 0 : 1;
    const bSame = b.service === myService ? 0 : 1;
    if (aSame !== bSame) return aSame - bSame;
    return a.distance - b.distance;
  });

  return (
    <Screen
      header={
        <View style={styles.head}>
          <Text style={[typography.h2, { color: colors.text }]}>{t('tagAlong.title')}</Text>
          <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>
            {t('tagAlong.subtitle')}
          </Text>
        </View>
      }
    >
      {/* How the shared-rating loop works */}
      <View style={styles.loopCard}>
        <View style={styles.loopRow}>
          <MaterialCommunityIcons name="account-group" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.captionMedium, { color: colors.accent }]}>
              {t('tagAlong.howItWorks')}
            </Text>
            <Text style={[typography.small, { color: colors.text, opacity: 0.85 }]}>
              {t('tagAlong.loopNote')}
            </Text>
          </View>
        </View>
      </View>

      <SectionHeader title={t('tagAlong.nearbyMentors')} style={styles.section} />
      {mentors.map((w) => (
        <MentorCard key={w.id} worker={w} myService={myService} />
      ))}

      <Card style={styles.foot}>
        <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center' }]}>
          {t('tagAlong.footNote')}
        </Text>
      </Card>
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  head: { paddingTop: spacing.md, paddingBottom: spacing.sm, gap: 2 },
  loopCard: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accentLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  loopRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm },
  foot: { gap: 0 },
  gradCard: { alignItems: 'center', paddingVertical: spacing.xl },
  gradRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, width: '100%' },
  gradIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
});