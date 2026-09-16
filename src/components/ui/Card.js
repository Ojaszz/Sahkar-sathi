import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export default function Card({ children, onPress, style, padded = true }) {
  const styles = makeStyles(colors);
  const inner = padded ? <View style={styles.padding}>{children}</View> : children;
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {inner}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{inner}</View>;
}

export function CardTitle({ title, subtitle, right, style }) {
  const styles = makeStyles(colors);
  return (
    <View style={[styles.headerRow, style]}>
      <View style={styles.headerText}>
        <Text style={typography.h3}>{title}</Text>
        {subtitle ? <Text style={[typography.caption, styles.subtitle]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  padding: { padding: spacing.lg },
  pressed: { opacity: 0.92 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  subtitle: { color: colors.textMuted },
});