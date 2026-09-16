import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Button, Input, Card, Modal, EmptyState } from '../src/components/ui';
import Header from '../src/components/ui/Header';
import AreaPicker from '../src/components/ui/AreaPicker';
import { colors, radius, spacing, typography } from '../src/theme';
import { useAddressStore } from '../src/store/addressStore';
import { t } from '../src/i18n';
import { useSettingsStore } from '../src/store/settingsStore';

export default function AddressesScreen() {
  const styles = makeStyles(colors);
  useSettingsStore((s) => s.theme);
  const addresses = useAddressStore((s) => s.addresses);
  // Add form state (inside a modal so the list stays clean).
  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [door, setDoor] = useState('');

  useEffect(() => {
    useAddressStore.getState().restore();
  }, []);

  const openAdd = () => {
    setLabel('');
    setArea('');
    setPincode('');
    setDoor('');
    setAddOpen(true);
  };

  const save = () => {
    if (!area) {
      Alert.alert(t('addresses.needArea'), t('addresses.needAreaNote'));
      return;
    }
    useAddressStore.getState().addAddress({ label, area, pincode, door });
    setAddOpen(false);
  };

  const remove = (a) => {
    Alert.alert(t('addresses.delete'), `${t('addresses.deleteConfirm')} ${a.full}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('addresses.delete'),
        style: 'destructive',
        onPress: () => useAddressStore.getState().removeAddress(a.id),
      },
    ]);
  };

  return (
    <Screen>
      <Header title={t('addresses.title')} right={<AddBtn onPress={openAdd} />} />
      <View style={styles.sunline}>
        <Text style={[typography.small, { color: colors.textMuted }]}>
          {t('addresses.hint')}
        </Text>
      </View>

      {addresses.length === 0 ? (
        <EmptyState icon="map-marker-plus-outline" title={t('addresses.empty')} note={t('addresses.emptyNote')} />
      ) : (
        addresses.map((a) => (
          <Card key={a.id} padded={false} style={styles.addrCard}>
            <Pressable
              style={styles.addrMain}
              onPress={() => useAddressStore.getState().setDefault(a.id)}
            >
              <View style={[styles.addrIcon, { backgroundColor: a.isDefault ? colors.primaryLight : colors.surface }]}>
                <MaterialCommunityIcons
                  name={a.isDefault ? 'home-variant' : 'map-marker-outline'}
                  size={20}
                  color={a.isDefault ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.addrLabelRow}>
                  <Text style={typography.bodyBold}>{a.label}</Text>
                  {a.isDefault ? (
                    <View style={styles.defaultChip}>
                      <Text style={[typography.small, { color: colors.success }]}>{t('addresses.default')}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>{a.full}</Text>
              </View>
              {!a.isDefault ? <StarBtn onPress={() => useAddressStore.getState().setDefault(a.id)} /> : null}
            </Pressable>
            <View style={styles.divider} />
            <View style={styles.addrFooter}>
              <Text style={[typography.small, { color: colors.textMuted }]}>
                {a.isDefault ? t('addresses.usedInBooking') : t('addresses.tapToDefault')}
              </Text>
              <Pressable onPress={() => remove(a)} hitSlop={10} style={styles.trash}>
                <MaterialCommunityIcons name="trash-can-outline" size={19} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))
      )}

      <Button title={t('addresses.add')} variant="outline" icon={<MaterialCommunityIcons name="plus" size={18} color={colors.primary} />} onPress={openAdd} style={{ marginTop: spacing.sm }} />

      {/* Add-address modal */}
      <Modal visible={addOpen} onClose={() => setAddOpen(false)} title={t('addresses.add')}>
        <Input label={t('addresses.labelName')} value={label} onChangeText={setLabel} placeholder={t('addresses.labelPlaceholder')} />
        <AreaPicker label={t('bookings.selectArea')} value={area} onChange={(a, pin) => { setArea(a); setPincode(pin || ''); }} placeholder={t('bookings.chooseArea')} />
        <Input label={t('addresses.doorLabel')} value={door} onChangeText={setDoor} placeholder={t('addresses.doorPlaceholder')} icon={<MaterialCommunityIcons name="home-outline" size={20} color={colors.textMuted} />} />
        <Button title={t('addresses.save')} onPress={save} style={{ marginTop: spacing.sm }} />
      </Modal>
    </Screen>
  );
}

// Tiny header action button (right slot of the Header).
function AddBtn({ onPress }) {
  const styles = makeStyles(colors);
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.addBtn}>
      <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
    </Pressable>
  );
}

function StarBtn({ onPress }) {
  const styles = makeStyles(colors);
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.starBtn}>
      <MaterialCommunityIcons name="star-outline" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  sunline: { marginBottom: spacing.md },
  addrCard: { padding: spacing.md, marginBottom: spacing.sm },
  addrMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  addrIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  defaultChip: {
    backgroundColor: colors.successLight,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  addrFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trash: { padding: 4 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBtn: { padding: 4 },
});