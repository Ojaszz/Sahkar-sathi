// Saved addresses for the customer. Persisted on-device (AsyncStorage) so the
// address book survives restarts, and the booking form prefills from the default
// one — reuse without re-typing. Demo-scoped: plain JSON on the phone, no board.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ss_addresses_v1';

// Format exactly like the booking form derives its address line, so a saved
// address and a freshly typed one are interchangeable in /booking/new.
export function addressLine({ door, area, pincode }) {
  const parts = [];
  if (door && door.trim()) parts.push(door.trim());
  parts.push(area);
  if (pincode) parts.push(`Pune ${pincode}`);
  return parts.join(', ');
}

// A couple of sensible starting points so the demo profile already has addresses.
function seed() {
  return [
    { id: 'a1', label: 'Home', door: '12', area: 'FC Road', pincode: '411005', full: '12, FC Road, Pune 411005', isDefault: true },
    { id: 'a2', label: 'Office', door: '', area: 'Sahakar Nagar', pincode: '411009', full: 'Sahakar Nagar, Pune 411009', isDefault: false },
  ];
}

export const useAddressStore = create((set, get) => ({
  addresses: [],

  restore: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          set({ addresses: parsed });
          return;
        }
      }
    } catch {
      /* ignore */
    }
    set({ addresses: seed() });
  },

  defaultAddress() {
    return get().addresses.find((a) => a.isDefault) || get().addresses[0] || null;
  },

  addAddress({ label, area, pincode, door }) {
    const addresses = get().addresses;
    const first = !addresses.length;
    const next = [
      ...addresses,
      {
        id: `ad${Date.now().toString(36)}${Math.floor(Math.random() * 9)}`,
        label: (label || 'Address').trim(),
        door: (door || '').trim(),
        area,
        pincode,
        full: addressLine({ door, area, pincode }),
        isDefault: first,
      },
    ];
    set({ addresses: next });
    get().persist(next);
    return next[next.length - 1];
  },

  removeAddress(id) {
    if (get().addresses.length <= 1) return; // keep at least one
    let addresses = get().addresses.filter((a) => a.id !== id);
    if (!addresses.some((a) => a.isDefault)) {
      addresses = addresses.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
    }
    set({ addresses });
    get().persist(addresses);
  },

  setDefault(id) {
    const addresses = get().addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    set({ addresses });
    get().persist(addresses);
  },

  persist(addresses) {
    AsyncStorage.setItem(KEY, JSON.stringify(addresses)).catch(() => {});
  },

  reset() {
    set({ addresses: seed() });
    get().persist(seed());
  },
}));