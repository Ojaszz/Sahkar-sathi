import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, EmptyState, Avatar } from '../../src/components/ui';
import { colors, radius, spacing, typography } from '../../src/theme';
import { getWorker } from '../../src/data/workers';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore, chatKey } from '../../src/store/chatStore';
import { useWorkerDirectoryStore } from '../../src/store/workerDirectoryStore';
import { t } from '../../src/i18n';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function CustomerChat() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingStore((s) => s.bookings);
  const active = useChatStore((s) => s.active);
  const msgs = useChatStore((s) => s.messagesByConv);

  // Build a list of distinct workers you have booked (thread list).
  //
  // A booking's workerId is EITHER a seeded demo id (w1…w5, safe to
  // `getWorker()`) OR a registered worker's uid that only exists in
  // workerDirectoryStore, OR null while the job is still unclaimed. getWorker()
  // falls back to WORKERS[0] for anything unknown, so we resolve the correct
  // profile here — and dedupe by the RAW booking workerId (uids AND demo ids),
  // so the keyExtractor never sees two rows with the same id.
  const bookedWorkers = useMemo(() => {
    const registeredWorkers = useWorkerDirectoryStore.getState().byId;
    const seen = new Map();
    for (const b of bookings) {
      if (b.customerId !== user?.id || !b.workerId) continue; // skips unclaimed requests
      if (seen.has(b.workerId)) continue;
      const w = registeredWorkers[b.workerId] || getWorker(b.workerId);
      if (w && w.id) seen.set(b.workerId, w);
    }
    return [...seen.values()];
  }, [bookings, user?.id]);

  if (active && user) {
    return (
      <ChatThread
        customerId={active.customerId}
        workerId={active.workerId}
        user={user}
        onBack={() => useChatStore.getState().close()}
      />
    );
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
          style={{ flex: 1 }}
          renderItem={({ item }) => {
            const preview = msgs[chatKey(user?.id, item.id)]?.at(-1)?.text || t(`categories.${item.service}`);
            return (
              <Pressable
                style={styles.thread}
                onPress={() => useChatStore.getState().openConversation(user?.id, item.id)}
              >
                <Avatar emoji={item.avatar} size={50} online={item.available} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>{item.name}</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                    {preview}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

function ChatThread({ customerId, workerId, user, onBack }) {
  const styles = makeStyles(colors);
  const worker = getWorker(workerId);
  const messages = useChatStore((s) => s.messagesByConv[chatKey(customerId, workerId)]) || [];
  const [text, setText] = useState('');

  // Pre-fed questions the customer can ask the worker (one-tap send).
  const quickQuestions = [0, 1, 2, 3, 4].map((i) => t(`chat.suggestions.customer${i}`));

  useEffect(() => {
    useChatStore.getState().setCurrentUser({ id: user?.id, name: user?.name, role: user?.role || 'customer' });
    useChatStore.getState().setActive({ customerId, workerId });
  }, [customerId, workerId]);

  if (!worker) return null;

  const send = () => {
    if (!text.trim()) return;
    useChatStore.getState().send(customerId, workerId, text.trim());
    setText('');
  };

  const sendQuick = (question) => {
    useChatStore.getState().send(customerId, workerId, question);
  };

  const timeOf = (t) => {
    try {
      return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
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

      {messages.length === 0 ? (
        <View style={styles.threadEmpty}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{t('chat.sayHi')}</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.bubbleWrap, mine ? styles.bubbleMineWrap : styles.bubbleTheirsWrap]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[typography.body, { color: mine ? colors.white : colors.text }]}>{item.text}</Text>
                  <Text style={[typography.small, mine ? { color: colors.white + '99' } : { color: colors.textMuted }]}>
                    {timeOf(item.time)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Quick questions — one tap sends the pre-fed question to the worker */}
      <View style={styles.quickWrap}>
        <Text style={[typography.small, { color: colors.textMuted, marginBottom: 4 }]}>
          {t('chat.suggestions.customerTitle')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickQuestions.map((question) => (
            <Pressable key={question} style={styles.quickChip} onPress={() => sendQuick(question)}>
              <Text style={[typography.captionMedium, { color: colors.primary }]}>{question}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

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
  threadEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  quickWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  quickChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
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