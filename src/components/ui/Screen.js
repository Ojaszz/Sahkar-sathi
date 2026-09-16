import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';

// Base screen wrapper with safe area, optional scroll, optional header
export default function Screen({ children, scroll = true, style, contentContainerStyle, header, footer }) {
  const styles = makeStyles(colors);
  // Subscribe to the theme so this screen (and everything it renders, since
  // screens aren't memoized) re-renders with the current palette on a toggle.
  // The native Stack does NOT propagate parent re-renders reliably, so the
  // subscription has to live here — this is what actually repaints each screen.
  const theme = useSettingsStore((s) => s.theme); // eslint-disable-line no-unused-vars
  const content = (
    <View style={[styles.body, contentContainerStyle]}>
      {header}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{content}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  body: { flexGrow: 1, paddingHorizontal: spacing.lg },
});