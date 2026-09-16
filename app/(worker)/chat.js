// In the worker app, conversations are derived from (a) bookings: each customer
// that requested this worker's services appears as a thread, and (b) TAG-ALONG
// pairs: a worker who asked a mentor "take me along" (or who accepted such a
// request) gets a worker↔worker thread. All messages sync live over the shared
// Supabase board (polled by syncStore every ~1.5 s); a thread is just the
// (customer_id, worker_id) pair.
//
// For worker↔worker threads the pair is (junior_id, mentor_id) — the same ids the
// tag-along request message was seeded with — so both phones' existing poll
// filter `or=(customer_id.eq.<me>,worker_id.eq.<me>)` picks both threads up and
// replies sync with zero message-infra changes.

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, EmptyState } from '../../src/components/ui';
import Avatar from '../../src/components/ui/Avatar';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useBookingStore } from '../../src/store/bookingStore';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore, chatKey } from '../../src/store/chatStore';
import { useTagAlongStore } from '../../src/store/tagAlongStore';
import { useSyncStore } from '../../src/store/syncStore';
import { t } from '../../src/i18n';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function WorkerChat() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme); // theme re-render
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingStore((s) => s.bookings);
  const active = useChatStore((s) => s.active);
  const msgs = useChatStore((s) => s.messagesByConv);
  const tagRows = useTagAlongStore((s) => s.rows);
  const sendError = useChatStore((s) => s.sendError);
  const msgError = useSyncStore((s) => s.msgError);
  const msgCount = useSyncStore((s) => s.msgCount);

  const workerId = user?.id || 'w1';
  const customers = [...new Map(
    bookings.filter((b) => b.workerId === workerId).map((b) => [b.customerId, { id: b.customerId, name: b.customerName }])
  ).values()];

  // Emergency broadcasts: threads a customer opened by pressing "Message all
  // available workers" on the SOS screen. They come over the same messages board
  // (worker_id == my static id) but have no booking behind them, so they wouldn't
  // appear in `customers` above — add any 🚨 conversation we're not already listing.
  const emergencyThreads = [];
  for (const [key, list] of Object.entries(msgs)) {
    if (!list?.some((m) => String(m.text || '').startsWith('🚨'))) continue;
    const [cid, wid] = key.split('::');
    if (wid !== workerId) continue;
    if (customers.some((c) => c.id === cid)) continue; // already a booking thread
    const sender = list[0]?.senderName;
    emergencyThreads.push({
      customerId: cid,
      workerId,
      name: sender && sender !== workerId ? sender : `${t('emergency.title')}`,
      emoji: '🚨',
    });
  }

  // Worker↔worker threads from tag-along pairs (either side of the pair).
  const peers = [
    ...tagRows.filter((r) => r.juniorId === workerId).map((r) => ({
      customerId: workerId, // junior (me) is the "customer" side of the pair
      workerId: r.mentorId,
      name: r.mentorName || 'Mentor',
      emoji: '👨‍🔧',
    })),
    ...tagRows.filter((r) => r.mentorId === workerId).map((r) => ({
      customerId: r.juniorId, // junior is the "customer" side
      workerId, // me (mentor) is the worker side
      name: r.juniorName || 'New member',
      emoji: '🧑‍🔧',
    })),
  ];

  const threads = [
    ...customers.map((c) => ({ customerId: c.id, workerId, name: c.name, emoji: '👩' })),
    ...peers,
    ...emergencyThreads,
  ];

  // Demo fallback (Expo Go, no backend needed): give THIS worker one lively
  // "Ojas" conversation so the tab is never an empty state. Real booked
  // threads above always win; this only fills an otherwise-empty list.
  const DEMO_CUSTOMER_ID = 'demo_customer'; // local-only; never matched by Supabase
  useEffect(() => {
    if (!user?.id || threads.length > 0) return;
    const chat = useChatStore.getState();
    const key = chatKey(DEMO_CUSTOMER_ID, user.id);
    if (chat.messagesByConv[key]?.length) return; // already seeded
    const now = Date.now();
    const lines = [
      { text: `Hi ${user?.name}! I'm Ojas — I booked your ${t(`categories.${user?.service || 'repair'}`)} service. Are you available tomorrow morning?`, sender: DEMO_CUSTOMER_ID, name: 'Ojas', role: 'customer' },
      { text: `Namaste Ojas! Yes, morning works for me. I'll be at FC Road around 10 AM.`, sender: user.id, name: user?.name || 'Worker', role: 'worker' },
      { text: `Perfect, see you then. I also have a small electrical issue in the kitchen if you can check it. 🙏`, sender: DEMO_CUSTOMER_ID, name: 'Ojas', role: 'customer' },
      { text: `No problem, I'll look at both. Message me here if anything changes.`, sender: user.id, name: user?.name || 'Worker', role: 'worker' },
    ];
    chat.mergeRemoteMsgs(lines.map((m, i) => ({
      id: `demo_${user.id}_${i}`,
      customer_id: DEMO_CUSTOMER_ID,
      worker_id: user.id,
      sender_id: m.sender,
      sender_name: m.name,
      sender_role: m.role,
      text: m.text,
      created_at: new Date(now - (lines.length - i) * 60_000).toISOString(),
    })));
  }, [user?.id, user?.name, user?.service, threads.length]);

  // After seeding, show the demo thread when there are no real threads yet.
  const displayThreads = threads.length
    ? threads
    : [{ customerId: DEMO_CUSTOMER_ID, workerId, name: 'Ojas', emoji: '👩', threadKey: DEMO_CUSTOMER_ID }];

  useEffect(() => {
    useChatStore.getState().setCurrentUser({ id: user?.id, name: user?.name, role: 'worker' });
  }, [user?.id]);

  if (active) {
    const pair = displayThreads.find((th) => th.customerId === active.customerId && th.workerId === active.workerId);
    return (
      <ChatThread
        customerId={active.customerId}
        workerId={active.workerId}
        partnerName={pair?.name || (active.customerId === workerId ? t('tagAlong.mentor') : t('chat.customer'))}
        partnerEmoji={pair?.emoji || '👨‍🔧'}
        onBack={() => useChatStore.getState().close()}
      />
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={[typography.h2, { color: colors.text }]}>{t('chat.title')}</Text>
      </View>
      {(sendError || msgError) && (
        <View style={styles.syncBanner}>
          <Text style={[typography.small, { color: '#fff' }]}>
            ⚠ {sendError ? `Send: ${sendError}` : msgError}
          </Text>
        </View>
      )}
      {msgError === null && msgCount !== null && !sendError && (
        <View style={[styles.syncBanner, { backgroundColor: colors.success }]}>
          <Text style={[typography.small, { color: '#fff' }]}>● Sync live — {msgCount} messages</Text>
        </View>
      )}
      {displayThreads.length === 0 ? (
        <EmptyState icon="chat-processing-outline" title={t('chat.empty')} note={t('chat.emptyNote')} />
      ) : (
        <FlatList
          data={displayThreads}
          keyExtractor={(th) => chatKey(th.customerId, th.workerId)}
          contentContainerStyle={{ paddingBottom: 120 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => {
            const key = chatKey(item.customerId, item.workerId);
            const booking = bookings.find((b) => b.customerId === item.customerId && b.workerId === workerId);
            const preview = msgs[key]?.at(-1)?.text
              || booking?.issue?.slice(0, 40)
              || (booking ? t(`categories.${booking.service}`) : t('tagAlong.threadNote'));
            return (
              <Pressable
                style={styles.thread}
                onPress={() => useChatStore.getState().setActive({ customerId: item.customerId, workerId: item.workerId })}
              >
                <Avatar emoji={item.emoji} size={50} online />
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

function ChatThread({ customerId, workerId, partnerName, partnerEmoji, onBack }) {
  const styles = makeStyles(colors);
  const messages = useChatStore((s) => s.messagesByConv[chatKey(customerId, workerId)]) || [];
  const me = useAuthStore((s) => s.user);
  const [text, setText] = useState('');

  // Pre-fed quick replies this worker can send with one tap (demo-friendly:
  // "hello", "arrive on time", "service confirmed", plus FAQ-style lines).
  const quickReplies = [0, 1, 2, 3, 4].map((i) => t(`chat.suggestions.worker${i}`));

  useEffect(() => {
    useChatStore.getState().setCurrentUser({ id: me?.id, name: me?.name, role: 'worker' });
    useChatStore.getState().setActive({ customerId, workerId });
  }, [customerId, workerId]);

  const send = () => {
    if (!text.trim()) return;
    useChatStore.getState().send(customerId, workerId, text.trim());
    setText('');
  };

  const sendQuick = (reply) => {
    useChatStore.getState().send(customerId, workerId, reply);
  };

  const timeOf = (tm) => {
    try {
      return new Date(tm).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.threadHeader}>
        <Pressable onPress={onBack} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Avatar emoji={partnerEmoji} size={40} online />
        <View style={{ flex: 1 }}>
          <Text style={typography.bodyBold}>{partnerName}</Text>
          <Text style={[typography.small, { color: colors.success }]}>● Live</Text>
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
            // mine = sent by THIS phone, regardless of role (works for customer↔
            // worker AND worker↔worker threads, where both sides are 'worker').
            const mine = item.senderId === me?.id;
            return (
              <View style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.theirsWrap]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
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

      {/* Quick replies — one tap sends the pre-fed message straight to the customer */}
      <View style={styles.quickWrap}>
        <Text style={[typography.small, { color: colors.textMuted, marginBottom: 4 }]}>
          {t('chat.suggestions.workerTitle')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickReplies.map((reply) => (
            <Pressable key={reply} style={styles.quickChip} onPress={() => sendQuick(reply)}>
              <Text style={[typography.captionMedium, { color: colors.primary }]}>{reply}</Text>
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
  mineWrap: { alignSelf: 'flex-end' },
  theirsWrap: { alignSelf: 'flex-start' },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  mine: { backgroundColor: '#2E7BB0', borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, minHeight: 44, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.background, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E7BB0', alignItems: 'center', justifyContent: 'center' },
  syncBanner: {
    backgroundColor: colors.danger || '#e74c3c',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
});