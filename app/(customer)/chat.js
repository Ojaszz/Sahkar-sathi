import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, EmptyState, Button, Avatar } from '../../src/components/ui';
import { colors, radius, spacing, typography } from '../../src/theme';
import { getWorker } from '../../src/data/workers';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { t } from '../../src/i18n';

export default function CustomerChat() {
  const styles = makeStyles(colors);
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingStore((s) => s.bookings);
  const [active, setActive] = useState(null); // worker object

  // Build a list of distinct workers you have booked
  const bookedWorkers = [...new Map(
    bookings.filter((b) => b.customerId === user?.id).map((b) => [b.workerId, getWorker(b.workerId)])
  ).values()];

  useEffect(() => {
    if (bookedWorkers.length && !active) {
      useChatStore.getState().setCurrentUser({ id: user?.id, name: user?.name, role: 'customer' });
    }
  }, [bookings]);

  if (active) {
    return <ChatThread worker={active} onBack={() => setActive(null)} />;
  }

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('chat.title')}</Text>
      </View>
      {bookedWorkers.length === 0 ? (
        <EmptyState icon="chat-processing-outline" title={t('chat.empty')} note={t('chat.emptyNote')} />
      ) : (
        <FlatList
          data={bookedWorkers}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <Pressable style={styles.thread} onPress={() => setActive(item)}>
              <Avatar emoji={item.avatar} size={50} online={item.available} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={typography.bodyBold}>{item.name}</Text>
                  <Text style={[typography.small, { color: colors.textMuted }]}>10:2{Math.floor(Math.random() * 9)} AM</Text>
                </View>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{t(`categories.${item.service}`)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

function ChatThread({ worker, onBack }) {
  const styles = makeStyles(colors);
  const user = useAuthStore((s) => s.user);
  const { activeConversation, sendMessage, openConversation } = useChatStore();
  const [text, setText] = useState('');

  useEffect(() => {
    useChatStore.getState().setCurrentUser({ id: user?.id, name: user?.name, role: 'customer' });
    openConversation(user?.id, worker.id);
  }, []);

  const messages = activeConversation?.messages || [];
  const greeting =
    messages.length === 0
      ? [
          { id: 'a', senderId: worker.id, text: `Namaste! I'm ${worker.name}, your ${t(`categories.${worker.service}`)}. How can I help? 🙏`, time: new Date().toISOString() },
          { id: 'b', senderId: user?.id, text: `Hi ${worker.name}, I need help with ${t(`categories.${worker.service}`)} at my place.`, time: new Date().toISOString() },
        ]
      : messages;

  const send = async () => {
  const styles = makeStyles(colors);
    if (!text.trim()) return;
    await sendMessage(text.trim());
    setText('');
  };

  return (
    <Screen scroll={false}>
      {/* Thread header */}
      <View style={styles.threadHeader}>
        <Pressable onPress={onBack} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Avatar emoji={worker.avatar} size={40} online={worker.available} />
        <View style={{ flex: 1 }}>
          <Text style={typography.bodyBold}>{worker.name}</Text>
          <Text style={[typography.small, { color: colors.success }]}>● Online</Text>
        </View>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={greeting}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          return (
            <View style={[styles.bubbleWrap, mine ? styles.bubbleMineWrap : styles.bubbleTheirsWrap]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[typography.body, { color: mine ? colors.white : colors.text }]}>{item.text}</Text>
              </View>
            </View>
          );
        }}
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
          <Pressable style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]} onPress={send}>
            <MaterialCommunityIcons name="send" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  bubbleMineWrap: { alignSelf: 'flex-end' },
  bubbleTheirsWrap: { alignSelf: 'flex-start' },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.background, fontSize: 15 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});