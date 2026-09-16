import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';
import { t } from '../src/i18n';

const TYPES = [
  { key: 'water', icon: 'water-outline' },
  { key: 'power', icon: 'power-plug-outline' },
  { key: 'lock', icon: 'lock-outline' },
  { key: 'medical', icon: 'medical-bag' },
  { key: 'other', icon: 'alert-outline' },
];

export default function EmergencyScreen() {
  const styles = makeStyles(colors);
  const router = useRouter();
  const [type, setType] = useState('water');
  const [phase, setPhase] = useState('select'); // select | searching | found

  const trigger = () => {
  const styles = makeStyles(colors);
    setPhase('searching');
    setTimeout(() => setPhase('found'), 2000);
  };

  return (
    <Screen scroll={phase === 'select'}>
      {phase === 'select' && (
        <>
          <View style={styles.top}>
            <View style={styles.siren}>
              <MaterialCommunityIcons name="siren" size={48} color={colors.white} />
            </View>
            <Text style={[typography.h1, { color: colors.danger }]}>{t('emergency.title')}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('emergency.subtitle')}
            </Text>
          </View>

          <Text style={[typography.h3, styles.label]}>{t('emergency.types.other', {})} — What's the issue?</Text>
          <View style={styles.typeGrid}>
            {TYPES.map((ty) => (
              <Pressable key={ty.key} style={[styles.typeBtn, type === ty.key && styles.typeActive]} onPress={() => setType(ty.key)}>
                <MaterialCommunityIcons name={ty.icon} size={22} color={type === ty.key ? colors.white : colors.danger} />
                <Text style={[typography.smallBold, { color: type === ty.key ? colors.white : colors.text }]}>
                  {t(`emergency.types.${ty.key}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
            {t('emergency.sosNote')}
          </Text>

          <Pressable style={styles.sosBtn} onPress={trigger}>
            <Text style={styles.sosText}>{t('emergency.sos')}</Text>
            <Text style={[typography.captionMedium, { color: colors.white }]}>{t('emergency.requestHelp')}</Text>
          </Pressable>

          <Button title={t('emergency.call')} variant="outline" onPress={() => null} style={{ marginTop: spacing.lg }} />
          <Button title={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
        </>
      )}

      {phase === 'searching' && (
        <View style={styles.center}>
          <View style={styles.pulse}>
            <MaterialCommunityIcons name="radar" size={48} color={colors.danger} style={{ opacity: 0.9 }} />
          </View>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>{t('emergency.sending')}</Text>
        </View>
      )}

      {phase === 'found' && (
        <View style={styles.center}>
          <View style={styles.foundIcon}>
            <MaterialCommunityIcons name="check" size={44} color={colors.white} />
          </View>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
            {t('emergency.found', { count: 3 })}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
            Nearest: Rajesh Kumar (0.9 km) • Mohammed Irfan (1.1 km) • Sunita Devi (2.1 km)
          </Text>
          <Button title={t('emergency.call')} style={{ marginTop: spacing.xl }} onPress={() => null} />
          <Button title={t('emergency.cancel')} variant="outline" onPress={() => router.back()} />
        </View>
      )}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  top: { alignItems: 'center', paddingTop: spacing.xl, gap: 8 },
  siren: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  label: { marginTop: spacing.xxl, marginBottom: spacing.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeBtn: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  typeActive: { backgroundColor: colors.danger },
  sosBtn: {
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xxl,
  },
  sosText: { color: colors.white, fontSize: 40, fontWeight: '900', letterSpacing: 2 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl * 2, gap: spacing.md },
  pulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  foundIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
});
