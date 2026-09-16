// Worker onboarding wizard — "complete your profile" (forced once after a new
// worker's first login, re-opened as Edit profile from the Profile menu).
//
// 4 steps on one scrollable screen: Service & skills → Training & certifications
// → Service areas → Languages & experience → Save. The step chips scroll to each
// section. All values live in local state; "Save & start working" persists via
// authStore.completeWorkerProfile (local + best-effort Supabase user_metadata).
//
// Edit mode: when the logged-in worker is already onboarded this screen behaves
// as an edit screen (pre-filled, saves and goes back).

import React, { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';
import { SERVICES, SKILLS_BY_SERVICE, getService } from '../src/data/services';
import { PUNE_AREAS } from '../src/utils/puneAreas';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { t } from '../src/i18n';

// Curated certification options pulled from the demo catalogue's real cert strings.
const CERTS_BY_SERVICE = {
  electrician: ['ITI Electrical', 'BIS License', 'Electrician License'],
  plumber: ['ITI Plumbing', 'NSDC Certified'],
  carpenter: ['ITI Carpentry'],
  painter: ['Industrial Painter Certificate', 'Painter Trade Certificate'],
  cleaner: ['Cleaning Safety Certified', 'Eco Products Trained'],
  caregiver: ['Certified Caregiver', 'First Aid & CPR', 'Home Nursing'],
  driver: ['Heavy Vehicle License', 'Commercial License', 'Defensive Driving'],
  gardener: ['Horticulture Training'],
  technician: ['AC Technician Certified', 'Refrigerant Handling', 'Appliance Repair Certified'],
  domestic: ['Food Safety Certified', 'Housekeeping Training'],
};

const WORKER_LANGS = ['Hindi', 'Marathi', 'English', 'Urdu', 'Telugu', 'Tamil', 'Punjabi', 'Gujarati', 'Bhojpuri'];
const EXP_CHIPS = ['< 1 year', '1–3 years', '3–5 years', '5+ years'];

const STEPS = [
  { key: 'service', icon: 'wrench' },
  { key: 'training', icon: 'certificate' },
  { key: 'area', icon: 'map-marker-radius' },
  { key: 'profile', icon: 'account-cowboy-hat' },
];

export default function WorkerOnboarding() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const editing = !!user?.onboarded;
  const scrollRef = useRef(null);
  const secY = useRef({}); // stepKey -> y-offset, measured on layout

  // Pre-fill from the existing profile in edit mode.
  const [service, setService] = useState(user?.service || '');
  const [skills, setSkills] = useState(user?.skills || []);
  const [certs, setCerts] = useState(user?.certifications || []);
  const [customCert, setCustomCert] = useState('');
  const [areas, setAreas] = useState(user?.serviceAreas || []);
  const [langs, setLangs] = useState(user?.languages || []);
  const [exp, setExp] = useState(user?.experienceYears || '');
  const [rate, setRate] = useState(String(user?.rate || ''));
  const [activeStep, setActiveStep] = useState('service');
  const [saving, setSaving] = useState(false);

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const jumpTo = (key) => {
    setActiveStep(key);
    const y = secY.current[key];
    if (y != null) scrollRef.current?.scrollTo?.({ y, animated: true });
  };

  const allCerts = [...(CERTS_BY_SERVICE[service] || []), ...(customCert.trim() ? [customCert.trim()] : [])];

  const canSave = !!service && areas.length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    await useAuthStore.getState().completeWorkerProfile({
      service,
      skills,
      certifications: certs.filter(Boolean),
      serviceAreas: areas,
      languages: langs,
      experienceYears: exp,
      rate: Number(rate) || getService(service).price,
    });
    setSaving(false);
    if (editing) router.back();
    else router.replace('/(worker)');
  };

  const ready = (key) => {
    if (key === 'service') return !!service;
    if (key === 'area') return areas.length > 0;
    return true;
  };

  return (
    <Screen
      header={
        <View style={styles.head}>
          <Text style={[typography.h2, { color: colors.text }]}>
            {editing ? t('profile.editProfile') : t('onboarding.title')}
          </Text>
          <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>
            {editing ? t('onboarding.editNote') : t('onboarding.subtitle')}
          </Text>
        </View>
      }
    >
      {/* Step chips + progress */}
      <View style={styles.chipsWrap}>
        <View style={styles.chipsRow}>
          {STEPS.map((s, i) => {
            const active = activeStep === s.key;
            return (
              <Pressable key={s.key} style={[styles.chip, active && styles.chipActive]} onPress={() => jumpTo(s.key)}>
                <MaterialCommunityIcons
                  name={ready(s.key) ? 'check-circle' : 'circle-outline'}
                  size={14}
                  color={active ? colors.white : ready(s.key) ? colors.success : colors.textMuted}
                />
                <Text style={[typography.captionMedium, { color: active ? colors.white : colors.textSecondary }]}>
                  {i + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Step 1 — service & skills */}
        <SectionWrap
          key="service"
          step="1"
          title={t('onboarding.serviceStep')}
          note={t('onboarding.serviceNote')}
          icon="wrench-outline"
          onLayout={(y) => (secY.current.service = y)}
          styles={styles}
        >
          <View style={styles.optionRow}>
            {SERVICES.map((s) => {
              const sel = service === s.id;
              return (
                <Pressable
                  key={s.id}
                  style={[styles.option, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primaryLight : colors.surface }]}
                  onPress={() => { setService(s.id); setSkills([]); if (!rate) setRate(String(s.price)); }}
                >
                  <Text style={styles.optionEmoji}><MaterialCommunityIcons name={sel ? 'check-circle' : 'circle-outline'} size={15} color={sel ? colors.primary : colors.textMuted} /></Text>
                  <Text style={[typography.captionMedium, { color: sel ? colors.primaryDark : colors.text, marginLeft: 6 }]}>
                    {t(`categories.${s.id}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {service ? (
            <View style={styles.subSection}>
              <Text style={[typography.captionMedium, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                {t('onboarding.skillsStep')}
              </Text>
              <View style={styles.optionRow}>
                {SKILLS_BY_SERVICE[service].map((sk) => {
                  const sel = skills.includes(sk);
                  return (
                    <Pressable key={sk} style={[styles.option, { borderColor: sel ? colors.accent : colors.border, backgroundColor: sel ? colors.accentLight : colors.surface }]} onPress={() => toggle(skills, setSkills, sk)}>
                      <Text style={[typography.captionMedium, { color: sel ? colors.success : colors.text }]}>{sel ? '✓ ' : ''}{sk}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </SectionWrap>

        {/* Step 2 — training & certifications */}
        <SectionWrap
          key="training"
          step="2"
          title={t('onboarding.trainingStep')}
          note={t('onboarding.trainingNote')}
          icon="certificate-outline"
          onLayout={(y) => (secY.current.training = y)}
          styles={styles}
        >
          {service ? (
            <View style={styles.optionRow}>
              {(CERTS_BY_SERVICE[service] || []).map((c) => {
                const sel = certs.includes(c);
                return (
                  <Pressable key={c} style={[styles.option, { borderColor: sel ? colors.accent : colors.border, backgroundColor: sel ? colors.accentLight : colors.surface }]} onPress={() => toggle(certs, setCerts, c)}>
                    <Text style={[typography.captionMedium, { color: sel ? colors.success : colors.text }]}>{sel ? '✓ ' : ''}{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('onboarding.pickServiceFirst')}</Text>
          )}
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              value={customCert}
              onChangeText={setCustomCert}
              placeholder={t('onboarding.addCert')}
              placeholderTextColor={colors.textMuted}
            />
            {customCert.trim() ? (
              <Pressable
                style={[styles.addBtn, { backgroundColor: allCerts.includes(customCert.trim()) ? colors.accentLight : colors.primary }]}
                onPress={() => { if (customCert.trim() && !certs.includes(customCert.trim())) toggle(certs, setCerts, customCert.trim()); }}
              >
                <Text style={[typography.captionMedium, { color: allCerts.includes(customCert.trim()) ? colors.success : colors.white }]}>
                  {allCerts.includes(customCert.trim()) ? '✓ Added' : '+'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </SectionWrap>

        {/* Step 3 — service areas */}
        <SectionWrap
          key="area"
          step="3"
          title={t('onboarding.areaStep')}
          note={t('onboarding.areaNote')}
          icon="map-marker-radius-outline"
          onLayout={(y) => (secY.current.area = y)}
          styles={styles}
        >
          <View style={styles.optionRow}>
            {PUNE_AREAS.map((a) => {
              const sel = areas.includes(a.area);
              return (
                <Pressable key={a.area} style={[styles.option, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primaryLight : colors.surface }]} onPress={() => toggle(areas, setAreas, a.area)}>
                  <Text style={[typography.captionMedium, { color: sel ? colors.primaryDark : colors.text }]}>{sel ? '✓ ' : ''}{a.area}</Text>
                </Pressable>
              );
            })}
          </View>
        </SectionWrap>

        {/* Step 4 — languages & experience */}
        <SectionWrap
          key="profile"
          step="4"
          title={t('onboarding.languagesStep')}
          note={t('onboarding.languagesNote')}
          icon="account-cowboy-hat-outline"
          onLayout={(y) => (secY.current.profile = y)}
          styles={styles}
        >
          <Text style={[typography.captionMedium, { color: colors.textSecondary, marginBottom: spacing.sm }]}>{t('worker.languages')}</Text>
          <View style={styles.optionRow}>
            {WORKER_LANGS.map((l) => {
              const sel = langs.includes(l);
              return (
                <Pressable key={l} style={[styles.option, { borderColor: sel ? colors.accent : colors.border, backgroundColor: sel ? colors.accentLight : colors.surface }]} onPress={() => toggle(langs, setLangs, l)}>
                  <Text style={[typography.captionMedium, { color: sel ? colors.success : colors.text }]}>{sel ? '✓ ' : ''}{l}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[typography.captionMedium, { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm }]}>{t('onboarding.experienceLabel')}</Text>
          <View style={styles.optionRow}>
            {EXP_CHIPS.map((e) => {
              const sel = exp === e;
              return (
                <Pressable key={e} style={[styles.option, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primaryLight : colors.surface }]} onPress={() => setExp(sel ? '' : e)}>
                  <Text style={[typography.captionMedium, { color: sel ? colors.primaryDark : colors.text }]}>{sel ? '✓ ' : ''}{e}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.captionMedium, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
              {t('onboarding.rateLabel')}
            </Text>
            <View style={styles.rateRow}>
              <Text style={[typography.body, { color: colors.textMuted }]}>₹</Text>
              <TextInput
                style={styles.rateInput}
                value={rate}
                onChangeText={setRate}
                placeholder="250"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={5}
              />
              <Text style={[typography.caption, { color: colors.textMuted }]}>/hr</Text>
            </View>
          </View>
        </SectionWrap>

        <View style={styles.footer}>
          <Button
            title={editing ? t('common.save') : t('onboarding.save')}
            icon={<MaterialCommunityIcons name="check" size={20} color={colors.white} />}
            loading={saving}
            disabled={!canSave}
            onPress={save}
          />
          <Text style={[typography.small, styles.muted, { textAlign: 'center' }]}>{t('onboarding.savedNote')}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

// A numbered section with a title + note, used inside the scroll body.
function SectionWrap({ step, title, note, icon, children, onLayout, styles }) {
  return (
    <View
      onLayout={(e) => onLayout(e.nativeEvent.layout.y)}
      style={styles.section}
    >
      <View style={styles.sectionHead}>
        <View style={styles.stepBadge}>
          <Text style={[typography.captionMedium, { color: colors.white }]}>{step}</Text>
        </View>
        <MaterialCommunityIcons name={icon} size={18} color={colors.accent} />
        <Text style={[typography.h3, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.md }]}>{note}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors) =>
  StyleSheet.create({
    head: { paddingTop: spacing.md, paddingBottom: spacing.sm, gap: 2 },
    chipsWrap: { marginBottom: spacing.sm },
    chipsRow: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.round, padding: spacing.xs, borderWidth: 1, borderColor: colors.border },
    chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: radius.round, paddingVertical: 8 },
    chipActive: { backgroundColor: colors.primary },
    section: { paddingTop: spacing.lg },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
    stepBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    option: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
    optionEmoji: { width: 16 },
    subSection: { marginTop: spacing.lg },
    customRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
    customInput: { flex: 1, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, fontSize: 14, color: colors.text },
    addBtn: { width: 76, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    rateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 52 },
    rateInput: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
    footer: { paddingTop: spacing.xl, gap: spacing.sm },
    muted: { color: colors.textMuted },
  });