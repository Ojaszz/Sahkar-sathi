import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';

export function StarRow({ rating = 0, size = 16, style }) {
  const styles = makeStyles(colors);
  return (
    <View style={[styles.row, style]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialCommunityIcons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={i <= Math.round(rating) ? colors.star : colors.textMuted}
        />
      ))}
    </View>
  );
}

export function RatingBubble({ rating, count, size = 11 }) {
  const styles = makeStyles(colors);
  return (
    <View style={styles.bubble}>
      <MaterialCommunityIcons name="star" size={size} color={colors.white} />
      <Text style={[styles.bubbleText, { fontSize: size + 1 }]}>{rating.toFixed ? rating.toFixed(1) : rating}</Text>
      {count ? <Text style={[styles.bubbleCount, { fontSize: size - 1 }]}>({count})</Text> : null}
    </View>
  );
}

// Interactive star input for leaving a review
export function StarInput({ value, onChange, size = 34 }) {
  const styles = makeStyles(colors);
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <View style={styles.rowCenter}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} onPressIn={() => setHover(i)} onPressOut={() => setHover(0)} hitSlop={6}>
          <MaterialCommunityIcons
            name={i <= active ? 'star' : 'star-outline'}
            size={size}
            color={i <= active ? colors.star : colors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
  rowCenter: { flexDirection: 'row', gap: spacing.sm },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 3,
    alignSelf: 'flex-start',
  },
  bubbleText: { color: colors.white, fontWeight: '700' },
  bubbleCount: { color: 'rgba(255,255,255,0.85)' },
});