import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const VARIANTS = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.primaryLight, fg: colors.primaryDark, border: colors.primaryLight },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
  danger: { bg: colors.danger, fg: colors.white, border: colors.danger },
  dangerOutline: { bg: 'transparent', fg: colors.danger, border: colors.dangerLight },
  ghost: { bg: 'transparent', fg: colors.textSecondary, border: 'transparent' },
  accent: { bg: colors.accent, fg: colors.white, border: colors.accent },
  white: { bg: colors.white, fg: colors.primary, border: colors.white },
};

const SIZES = {
  sm: { py: spacing.sm, px: spacing.lg, font: { ...typography.captionMedium } },
  md: { py: 12, px: spacing.xl, font: typography.button },
  lg: { py: 15, px: spacing.xxl, font: typography.button },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  style,
  textStyle,
  fullWidth = true,
}) {
  const styles = makeStyles(colors);
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        { paddingVertical: s.py, paddingHorizontal: s.px },
        fullWidth && styles.full,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon}
          {title ? <Text style={[s.font, { color: v.fg }, styles.title, textStyle]}>{title}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  full: { width: '100%' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
  title: { textAlign: 'center' },
});