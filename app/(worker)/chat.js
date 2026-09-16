import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, EmptyState } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { t } from '../../src/i18n';

// In the worker app, conversations are derived from bookings: each customer
// that requested the worker's services appears as a thread.
export default function WorkerChat() {
  const styles = makeStyles(colors);
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingStore((s) => s.bookings);
  const [customer, setCustomer] = useState(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);

  const workerId = user?.id || 'w1';
  const customers = [...new Map(
    bookings.filter((b) => b.workerId === workerId).map((b) => [b.customerId, { id: b.customerId, name: b.customerName }])
  ).values()];

  const open = (c) => {
  const styles = makeStyles(colors);
    setCustomer(c);
    const svc = bookings.find((b) => b.customerId === c.id)?.service || 'service';
    setMessages([
      { id: 'a', mine: false, text: `Hello! I saw your booking for ${t(`categories.${svc}`)}. See you there!`, time: '10:05 AM' },
      { id: 'b', mine: true, text: 'Great, looking forward. Please confirm the time.', time: '10:06 AM' },
    ]);
  };

  const send = () => {
  const styles = makeStyles(colors);
    if (!text.trim()) return;
    setMessages([...messages, { id: String(Math.random()), mine: true, text: text.trim(), time: 'Now' }]);
    setText('');
  };

  if (customer) {
    return (
      <Screen scroll={false}>
        <View style={styles.threadHeader}>
          <Pressable onPress={() => setCustomer(null)} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>
          <Avatar emoji="👩" size={40} online />
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold}>{customer.name}</Text>
            <Text style={[typography.small, { color: colors.success }]}>● Customer</Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrap, item.mine ? styles.mineWrap : styles.theirsWrap]}>
              <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
                <Text style={[typography.body, { color: item.mine ? colors.white : colors.text }]}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={t('common.typeMessage')}
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Pressable style={styles.sendBtn} onPress={send}>
              <MaterialCommunityIcons name="send" size={20} color={colors.white} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('chat.title')}</Text>
      </View>
      {customers.length === 0 ? (
        <EmptyState icon="chat-processing-outline" title={t('chat.empty')} note={t('chat.emptyNote')} />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <Pressable style={styles.thread} onPress={() => open(item)}>
              <Avatar emoji="👩" size={50} online />
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{item.name}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {bookings.find((b) => b.customerId === item.id)?.issue?.slice(0, 40)}...
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  header: { marginTop: spacing.md, marginBottom: spacing.md },
  thread: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  bubbleWrap: { maxWidth: '80%' },
  mineWrap: { alignSelf: 'flex-end' },
  theirsWrap: { alignSelf: 'flex-start' },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  mine: { backgroundColor: '#2E7BB0', borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, minHeight: 44, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.background, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E7BB0', alignItems: 'center', justifyContent: 'center' },
});