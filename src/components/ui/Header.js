import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, layout, spacing, typography } from '../../theme';

export default function Header({
  title,
  subtitle,
  onBack,
  right,
  variant = 'default', // default | primary
  transparent,
}) {
  const styles = makeStyles(colors);
  const router = useRouter();
  return (
    <View style={[styles.header, transparent && styles.transparent, variant === 'primary' && styles.primary]}>
      {onBack !== false ? (
        <Pressable onPress={onBack || (() => router.back())} style={styles.iconBtn} hitSlop={10}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={variant === 'primary' ? colors.white : colors.text}
          />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <View style={styles.titleWrap}>
        <Text
          numberOfLines={1}
          style={[
            typography.h3,
            { color: variant === 'primary' ? colors.white : colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={[typography.caption, { color: variant === 'primary' ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right || <View style={styles.iconBtn} />}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.headerHeight,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  primary: { backgroundColor: colors.primary },
  transparent: { backgroundColor: 'transparent' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1 },
});