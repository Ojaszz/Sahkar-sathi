import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Card, CoopCallout } from '../src/components/ui';
import Header from '../src/components/ui/Header';
import { colors, radius, spacing, typography } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import { useRouter } from 'expo-router';
import { t } from '../src/i18n';
import { useSettingsStore } from '../src/store/settingsStore';

const FAQ_KEYS = ['booking', 'cancel', 'payment', 'reschedule', 'emergency', 'membership'];

export default function HelpScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [openFaq, setOpenFaq] = useState(FAQ_KEYS[0]);

  // Demo friendly actions: real wires where they make sense (SOS, chat), friendly
  // placeholders for the phone/WhatsApp/email that a real coop would connect.
  const callSupport = () => {
    Alert.alert(t('help.contact'), `${t('help.callNote')}\n\n${t('help.demoCallNote')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.done'), onPress: () => {} },
    ]);
  };

  return (
    <Screen>
      <Header title={t('help.title')} subtitle={t('help.subtitle')} />
      <View style={styles.sunline}>
        <CoopCallout
          icon="lifebuoy"
          title={t('help.quickPath')}
          note={t('help.quickPathNote')}
        />
      </View>

      {/* FAQ accordion */}
      <Text style={[typography.h3, styles.section]}>{t('help.faqTitle')}</Text>
      <Card padded={false} style={styles.faqCard}>
        {FAQ_KEYS.map((k, i) => {
          const open = openFaq === k;
          return (
            <View key={k} style={[styles.faqItem, i > 0 && styles.faqItemTop]}>
              <Pressable style={styles.faqHead} onPress={() => setOpenFaq(open ? '' : k)}>
                <MaterialCommunityIcons
                  name={FAQ_ICONS[k]}
                  size={18}
                  color={open ? colors.primary : colors.textSecondary}
                />
                <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>
                  {t(`help.faq.${k}.q`)}
                </Text>
                <MaterialCommunityIcons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
              {open ? (
                <Text style={[typography.small, styles.faqBody]}>{t(`help.faq.${k}.a`)}</Text>
              ) : null}
            </View>
          );
        })}
      </Card>

      {/* Contact routes */}
      <Text style={[typography.h3, styles.section]}>{t('help.contactTitle')}</Text>
      <Card padded={false} style={styles.contactCard}>
        <ContactRow icon="phone-outline" color={colors.success} label={t('help.call')} note={t('help.callNote')} onPress={callSupport} />
        <ContactRow icon="message-outline" color={colors.info} label={t('help.whatsapp')} note={t('help.whatsappNote')} onPress={callSupport} />
        <ContactRow
          icon="email-outline"
          color={colors.accent}
          label={t('help.email')}
          note={t('help.emailNote')}
          onPress={() => Linking.openURL('mailto:sathi@coopsathi.example').catch(() => {})}
        />
        <ContactRow
          icon="forum-outline"
          color={colors.warning}
          label={t('help.askWorker')}
          note={t('help.askWorkerNote')}
          onPress={() => router.push(user?.role === 'worker' ? '/(worker)/chat' : '/(customer)/chat')}
        />
      </Card>

      <Text style={[typography.small, styles.responseNote]}>{t('help.responseNote')}</Text>
    </Screen>
  );
}

const FAQ_ICONS = {
  booking: 'calendar-check-outline',
  cancel: 'close-circle-outline',
  payment: 'currency-inr',
  reschedule: 'calendar-clock-outline',
  emergency: 'alarm-light-outline',
  membership: 'hand-coin-outline',
};

function ContactRow({ icon, color, label, note, onPress }) {
  const styles = makeStyles(colors);
  return (
    <Pressable style={styles.contactRow} onPress={onPress}>
      <View style={[styles.contactIcon, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon} size={19} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyBold, { color: colors.text }]}>{label}</Text>
        <Text style={[typography.small, { color: colors.textMuted }]}>{note}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  section: { marginTop: spacing.lg, marginBottom: spacing.md },
  faqCard: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, marginBottom: spacing.sm },
  faqItem: { paddingVertical: spacing.md },
  faqItemTop: { borderTopWidth: 1, borderTopColor: colors.divider },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  faqBody: { color: colors.textSecondary, marginTop: spacing.md, marginLeft: 34, lineHeight: 20 },
  contactCard: { padding: 0, marginBottom: spacing.sm },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  contactIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  responseNote: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  sunline: { marginBottom: spacing.sm },
});