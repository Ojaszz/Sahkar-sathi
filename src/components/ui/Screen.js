import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

// Base screen wrapper with safe area, optional scroll, optional header
export default function Screen({ children, scroll = true, style, contentContainerStyle, header, footer }) {
  const styles = makeStyles(colors);
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