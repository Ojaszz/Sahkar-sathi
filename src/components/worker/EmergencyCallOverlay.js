// Call-style ringing overlay for incoming emergency jobs on the worker phone.
// Covers the full screen with a pulsing red glow, shaking phone icon, vibration,
// emergency details, +20% extra pay badge, and Accept / Reject buttons.
// Persistently "rings" (haptic + animation) until the worker takes action.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../../theme';
import { useEmergenciesStore } from '../../store/emergenciesStore';
import { useAuthStore } from '../../store/authStore';
import { EMERGENCY_PAY_MULTIPLIER } from '../../utils/constants';
import { t } from '../../i18n';

export default function EmergencyCallOverlay() {
  const router = useRouter();
  const visibleEmergency = useEmergenciesStore((s) => s.visibleEmergency);
  const user = useAuthStore((s) => s.user);
  const acceptEmergency = useEmergenciesStore((s) => s.acceptEmergency);
  const rejectEmergency = useEmergenciesStore((s) => s.rejectEmergency);

  const pulse = useRef(new Animated.Value(0)).current;
  const phoneRotate = useRef(new Animated.Value(0)).current;
  const hapticTimer = useRef(null);

  // Ringing animation + continuous vibration while overlay is visible.
  useEffect(() => {
    if (!visibleEmergency) {
      pulse.setValue(0);
      phoneRotate.setValue(0);
      return;
    }

    // Red pulse glow.
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseAnim.start();

    // Phone shake.
    const shakeAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(phoneRotate, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(phoneRotate, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(phoneRotate, { toValue: 0, duration: 80, useNativeDriver: true }),
      ])
    );
    shakeAnim.start();

    // Haptic buzz repeating like a phone ring (iOS: notification haptic; Android: vibration fallback).
    const ring = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      hapticTimer.current = setTimeout(ring, 1500);
    };
    ring();

    return () => {
      pulseAnim.stop();
      shakeAnim.stop();
      if (hapticTimer.current) {
        clearTimeout(hapticTimer.current);
        hapticTimer.current = null;
      }
    };
  }, [visibleEmergency, pulse, phoneRotate]);

  const handleAccept = async () => {
    if (!visibleEmergency || !user?.id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const res = await acceptEmergency(visibleEmergency.id, user.id, user.name || 'Worker');
    if (res?.ok) router.push('/(worker)/jobs');
  };

  const handleReject = async () => {
    if (!visibleEmergency || !user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await rejectEmergency(visibleEmergency.id, user.id);
  };

  if (!visibleEmergency) return null;

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const shakeX = phoneRotate.interpolate({ inputRange: [-1, 0, 1], outputRange: [-10, 0, 10] });

  const extraPercent = Math.round((EMERGENCY_PAY_MULTIPLIER - 1) * 100);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Pulsing red glow behind the icon */}
        <Animated.View
          style={[
            styles.pulseRing,
            { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
          ]}
        />

        <View style={styles.card}>
          {/* Shaking phone icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ translateX: shakeX }] }]}>
            <MaterialCommunityIcons name="phone-ring" size={52} color={colors.white} />
          </Animated.View>

          <Text style={styles.emergencyLabel}>{t('emergencyCall.incoming')}</Text>
          <Text style={styles.emergencyType}>{visibleEmergency.problem}</Text>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={18} color={colors.white + 'CC'} />
            <Text style={styles.detailText}>{visibleEmergency.customer_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color={colors.white + 'CC'} />
            <Text style={styles.detailText} numberOfLines={2}>
              {visibleEmergency.location || t('emergency.unknownLocation')}
            </Text>
          </View>

          {/* +20% extra pay badge */}
          <View style={styles.payBadge}>
            <MaterialCommunityIcons name="cash" size={22} color={colors.success} />
            <Text style={styles.payText}>+{extraPercent}% {t('emergencyCall.extraPay')}</Text>
          </View>

          {/* Accept / Reject */}
          <View style={styles.actions}>
            <Pressable style={styles.rejectBtn} onPress={handleReject}>
              <MaterialCommunityIcons name="phone-hangup" size={26} color={colors.white} />
              <Text style={styles.rejectLabel}>{t('workerApp.reject')}</Text>
            </Pressable>
            <Pressable style={styles.acceptBtn} onPress={handleAccept}>
              <MaterialCommunityIcons name="phone" size={26} color={colors.white} />
              <Text style={styles.acceptLabel}>{t('workerApp.accept')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.danger,
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    width: '85%',
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emergencyLabel: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  emergencyType: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  detailText: {
    color: colors.white + 'DD',
    fontSize: 15,
  },
  payBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '22',
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  payText: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.xxl,
  },
  acceptBtn: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  acceptLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rejectLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
