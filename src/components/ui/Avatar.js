import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';

// Emoji-based avatar (avoids asset bundling in this demo).
// Centering is done with flexbox (not lineHeight tricks) so the glyph sits
// dead-center in the circle regardless of the emoji's internal metrics.
export default function Avatar({ emoji, name, size = 48, style, online }) {
  const styles = makeStyles(colors);
  const dims = { width: size, height: size, borderRadius: size / 2 };
  const emojiSize = Math.round(size * 0.5);
  return (
    <View style={[styles.wrap, dims, style]}>
      <View style={[dims, styles.emojiFrame]}>
        <Text
          allowFontScaling={false}
          style={[
            styles.emoji,
            { fontSize: emojiSize, lineHeight: Math.round(emojiSize * 1.15) },
          ]}
        >
          {emoji || '🙂'}
        </Text>
      </View>
      {online ? <View style={[styles.dot, { bottom: 2, right: 2 }]} /> : null}
    </View>
  );
}

export function InitialsAvatar({ name, size = 48, color = colors.primary, style }) {
  const styles = makeStyles(colors);
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[typography.bodyBold, styles.initials, { color: colors.white, fontSize: size * 0.34 }]}
      >
        {initials}
      </Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryLighter,
    overflow: 'hidden',
  },
  emojiFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
    includeFontPadding: false, // Android: emoji glyphs carry extra vertical padding
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  initials: { textAlign: 'center' },
});