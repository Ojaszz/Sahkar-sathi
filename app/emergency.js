import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Avatar } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';
import { t } from '../src/i18n';
import { useSettingsStore } from '../src/store/settingsStore';
import { useAuthStore } from '../src/store/authStore';
import { useChatStore } from '../src/store/chatStore';
import { useEmergenciesStore } from '../src/store/emergenciesStore';
import { WORKERS } from '../src/data/workers';
import { distanceKm } from '../src/utils/geo';
import { USER_LOCATION } from '../src/utils/constants';

const TYPES = [
  { key: 'water', icon: 'water-outline' },
  { key: 'power', icon: 'power-plug-outline' },
  { key: 'lock', icon: 'lock-outline' },
  { key: 'medical', icon: 'medical-bag' },
  { key: 'other', icon: 'alert-outline' },
];

// Deterministic demo phone number per worker (so Call genuinely dials in the
// demo without hardcoding). Real deployments would use stored numbers.
function workerPhone(w) {
  let h = 0;
  for (let i = 0; i < w.id.length; i++) h = (h * 31 + w.id.charCodeAt(i)) >>> 0;
  const digits = String(9000000000 + (h % 999999999));
  return `+9198${digits.slice(2, 10)}`;
}

export default function EmergencyScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme);
  const router = useRouter();
  const [type, setType] = useState('water');
  const [phase, setPhase] = useState('select'); // select | searching | found | done
  const [found, setFound] = useState([]); // nearest workers
  const [where, setWhere] = useState(null); // { lat, lng, known }
  const [locInfo, setLocInfo] = useState('');
  const [calling, setCalling] = useState(null);
  const [broadcast, setBroadcast] = useState('idle'); // idle | sending | sent
  const [dispatchId, setDispatchId] = useState(null); // the emergency row we raised
  const [noAnswer, setNoAnswer] = useState(false); // nobody accepted within the timeout
  const acceptedEmergency = useEmergenciesStore((s) => s.acceptedEmergency);

  // If nobody accepts this dispatch within 45 s, offer a "Call again" retry.
  useEffect(() => {
    if (phase !== 'found' || !dispatchId) return;
    if (acceptedEmergency?.id === dispatchId) return; // answered — no timer needed
    setNoAnswer(false);
    const timer = setTimeout(() => setNoAnswer(true), 45000);
    return () => clearTimeout(timer);
  }, [phase, dispatchId, acceptedEmergency?.id]);

  // Radar pulse animation (runs while "searching").
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== 'searching') return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

  // Try to get the user's real GPS location (falls back to the Pune demo base).
  // Returns { recognized: coords are the real device location vs. the fallback }.
  async function resolveLocation() {
    try {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        return { lat: pos.coords.latitude, lng: pos.coords.longitude, known: true };
      }
    } catch {}
    // Demo fallback: FC Road, Pune.
    return { lat: USER_LOCATION[0], lng: USER_LOCATION[1], known: false };
  }

  // "Call emergency" → actually opens the phone dialer on the demo line.
  async function trigger() {
    setBroadcast('idle');
    setPhase('searching');
    const whereAbout = await resolveLocation();
    setWhere(whereAbout);
    // Wait one pulse cycle so the user sees the radar, then show neighbours.
    setTimeout(async () => {
      const available = WORKERS.filter((w) => w.available);
      const ranked = available
        .map((w) => ({ ...w, dist: distanceKm([whereAbout.lat, whereAbout.lng], w.location) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);
      setFound(ranked);
      setLocInfo(whereAbout.known ? t('emergency.gpsOn') : t('emergency.gpsFallback'));
      setPhase('found');
      setCalling(null);

      // Auto-dispatch: insert an emergency row so every worker phone gets the
      // ringing call-style overlay within ~1.5 s. Keep the row id so the screen
      // can watch for an accept on THIS dispatch (and offer a retry if not).
      try {
        const u = useAuthStore.getState().user;
        const em = await useEmergenciesStore.getState().publishEmergency({
          customerId: u?.id || 'cust-emergency',
          customerName: u?.name || 'Customer',
          problem: t(`emergency.types.${type}`),
          location: u?.location || t('emergency.unknownLocation'),
          lat: whereAbout.lat,
          lng: whereAbout.lng,
          amount: 500,
        });
        if (em?.id) setDispatchId(em.id);
      } catch {}
    }, 1600);
  }

  const radarScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const radarOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  const callWorker = (w) => {
    const url = `tel:${workerPhone(w)}`;
    setCalling(w.id);
    Linking.openURL(url).catch(() => setCalling(null));
    setTimeout(() => { setCalling(null); setPhase('done'); }, 3000);
  };

  // Send "the problem" to every available worker found nearby — real messages on
  // the shared board, so each worker's Chat tab gets a 🚨 thread within ~1.5 s.
  const broadcastAll = async () => {
    if (!found.length || broadcast !== 'idle') return;
    setBroadcast('sending');
    const user = useAuthStore.getState().user;
    const problem = t(`emergency.types.${type}`);
    const sent = await useChatStore.getState().broadcastEmergency({
      workers: found,
      customerId: user?.id || 'cust-emergency',
      customerName: user?.name || 'Customer',
      problem,
      location: user?.location || t('emergency.unknownLocation'),
    });
    setBroadcast(sent > 0 ? 'sent' : 'idle');
  };

  // Re-raise the SOS with a fresh row → every worker phone rings again.
  const callAgain = async () => {
    const u = useAuthStore.getState().user;
    setNoAnswer(false);
    try {
      const em = await useEmergenciesStore.getState().publishEmergency({
        customerId: u?.id || 'cust-emergency',
        customerName: u?.name || 'Customer',
        problem: t(`emergency.types.${type}`),
        location: u?.location || t('emergency.unknownLocation'),
        lat: where?.lat,
        lng: where?.lng,
        amount: 500,
      });
      if (em?.id) setDispatchId(em.id);
    } catch {}
  };

  return (
    <Screen scroll={phase === 'select' || phase === 'found' || phase === 'done'}>
      {/* Always-visible way out of the emergency flow (this screen is a
          fullScreenModal — the platform back gesture isn't obvious). */}
      <Pressable style={styles.closeBar} onPress={() => router.back()} hitSlop={10}>
        <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textMuted} />
        <Text style={[typography.smallBold, { color: colors.textMuted }]}>{t('emergency.close')}</Text>
      </Pressable>

      {phase === 'select' && (
        <>
          <View style={styles.top}>
            <View style={styles.siren}>
              <MaterialCommunityIcons name="alarm-light" size={48} color={colors.white} />
            </View>
            <Text style={[typography.h1, { color: colors.danger }]}>{t('emergency.title')}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('emergency.subtitle')}
            </Text>
          </View>

          <Text style={[typography.h3, styles.label]}>{t('emergency.whatsWrong')}</Text>
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
        </>
      )}

      {phase === 'searching' && (
        <View style={styles.center}>
          <View style={styles.pulseWrap}>
            <Animated.View
              style={[styles.pulse, styles.pulseOuter, { transform: [{ scale: radarScale }], opacity: radarOpacity }]}
            />
            <View style={styles.pulseInner}>
              <MaterialCommunityIcons name="radar" size={48} color={colors.danger} />
            </View>
          </View>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>{t('emergency.sending')}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>{t('emergency.radarNote')}</Text>
        </View>
      )}

      {phase === 'found' && (
        <View style={styles.center}>
          <View style={styles.foundIcon}>
            <MaterialCommunityIcons name="check" size={44} color={colors.white} />
          </View>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>
            {t('emergency.found', { count: found.length })}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>{locInfo}</Text>

          {/* A worker accepted THIS dispatch → live feedback. */}
          {acceptedEmergency?.id === dispatchId ? (
            <View style={styles.acceptBanner}>
              <MaterialCommunityIcons name="check-decagram" size={20} color={colors.success} />
              <Text style={[typography.captionMedium, { color: colors.success }]}>
                {t('emergencyCall.workerAccepted', { name: acceptedEmergency.worker_name || 'Worker' })}
              </Text>
            </View>
          ) : broadcast === 'idle' && !noAnswer ? (
            <View style={styles.waitingBanner}>
              <MaterialCommunityIcons name="phone-incoming" size={18} color={colors.accent} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {t('emergencyCall.waiting')}
              </Text>
            </View>
          ) : null}

          {/* Nobody has accepted after the timeout → offer a retry that re-rings workers. */}
          {noAnswer && acceptedEmergency?.id !== dispatchId ? (
            <View style={styles.retryRow}>
              <View style={styles.retryTextWrap}>
                <MaterialCommunityIcons name="phone-missed" size={18} color={colors.danger} />
                <Text style={[typography.caption, { color: colors.danger }]}>
                  {t('emergencyCall.noAnswer')}
                </Text>
              </View>
              <Button
                title={t('emergencyCall.callAgain')}
                variant="danger"
                size="sm"
                fullWidth={false}
                style={{ minWidth: 120 }}
                onPress={callAgain}
              />
            </View>
          ) : null}

          {/* Message all available workers about the problem (→ live chat threads) */}
          {broadcast === 'sent' ? (
            <View style={styles.sentBanner}>
              <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              <Text style={[typography.captionMedium, { color: colors.success }]}>
                {t('emergency.messageSent', { count: found.length })}
              </Text>
            </View>
          ) : (
            <Button
              title={broadcast === 'sending' ? t('emergency.sending') : t('emergency.messageAll')}
              icon={<MaterialCommunityIcons name="message-text-outline" size={18} color={colors.white} />}
              variant="danger"
              style={{ marginTop: spacing.md }}
              onPress={broadcastAll}
              disabled={broadcast === 'sending'}
            />
          )}

          {/* Nearest available workers, computed from real GPS distance */}
          <View style={styles.workerList}>
            {found.map((w, i) => (
              <View key={w.id} style={styles.workerRow}>
                <Avatar emoji={w.avatar} size={42} online />
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>{w.name}</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>
                    {t(`categories.${w.service}`)} • {w.dist.toFixed(1)} km • {w.rating}★
                  </Text>
                </View>
                <Button
                  title={calling === w.id ? t('emergency.dialing') : t('emergency.callWorker')}
                  variant={i === 0 ? 'danger' : 'outline'}
                  size="sm"
                  fullWidth={false}
                  style={{ minWidth: 92 }}
                  onPress={() => callWorker(w)}
                  disabled={calling !== null}
                />
              </View>
            ))}
          </View>

          <Button
            title={t('emergency.goHome')}
            icon={<MaterialCommunityIcons name="home" size={18} color={colors.white} />}
            style={{ marginTop: spacing.lg }}
            onPress={() => router.back()}
          />
        </View>
      )}

      {phase === 'done' && (
        <View style={styles.center}>
          <View style={styles.doneIcon}>
            <MaterialCommunityIcons name="phone-check" size={40} color={colors.white} />
          </View>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>{t('emergency.helpOnWay')}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
            {t('emergency.helpOnWayNote')}
          </Text>
          <Button
            title={t('emergency.goHome')}
            icon={<MaterialCommunityIcons name="home" size={18} color={colors.white} />}
            style={{ marginTop: spacing.xl }}
            onPress={() => { setPhase('select'); router.back(); }}
          />
        </View>
      )}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  closeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  acceptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  retryTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
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
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm },
  pulseWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  pulseOuter: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.dangerLight,
  },
  pulseInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  workerList: { width: '100%', marginTop: spacing.md, gap: spacing.sm },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
});