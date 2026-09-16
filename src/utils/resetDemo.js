// "Start fresh" — wipes everything so the demo runs from a clean state.
//
//   resetDemo({ board: true })  -> clears THIS phone AND the shared Supabase board
//   resetDemo({})               -> clears just this phone
//
// Requires the anon DELETE policy to have been added in the SQL editor
// (see the LIVE_DEMO notes) for `board: true` to work.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, resetDeviceId } from '../lib/supabase';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore';
import { useChatStore } from '../store/chatStore';
import { useTagAlongStore } from '../store/tagAlongStore';
import { useEmergenciesStore } from '../store/emergenciesStore';
import { useDeclineStore } from '../store/declineStore';
import { useWorkerDirectoryStore } from '../store/workerDirectoryStore';

const LOCAL_KEYS = [
  'ss_auth_v1',
  'ss_device_id',
  'ss_visited_v1',
  'ss_bookings_v1',
  'ss_tracking_v1',
  'ss_settings_v1',
];

export async function resetDemo({ board = false } = {}) {
  // 1) Halt the sync engine + one-way bus so nothing re-injects rows.
  useSyncStore.getState().stop();

  // 2) Wipe the shared board first (needs the anon DELETE policy).
  if (board) {
    try {
      await Promise.all([
        supabase.remove('bookings', {}),
        supabase.remove('messages', {}),
        supabase.remove('tag_alongs', {}),
        supabase.remove('emergencies', {}),
        supabase.remove('worker_profiles', {}),
      ]);
    } catch (e) {
      // If the board wipe fails, still reset the phone; surface the reason.
      throw new Error(
        'Could not clear the Supabase board: ' +
          ((e && e.message) || e) +
          '\n\nAdd the anon DELETE policy first (see LIVE_DEMO notes).'
      );
    }
  }

  // 3) Local stores + AsyncStorage.
  try {
    await AsyncStorage.multiRemove(LOCAL_KEYS);
  } catch {}
  useAuthStore.setState({ user: null, isAuthenticated: false, loading: false });
  useBookingStore.setState({ bookings: [] });
  useChatStore.getState().reset();
  useTagAlongStore.getState().reset();
  useEmergenciesStore.getState().reset();
  useDeclineStore.getState().reset();
  useWorkerDirectoryStore.getState().reset();
  // Fresh identity so the next demo run is a brand-new customer (the old device
  // id's bookings/messages were just wiped off the shared board).
  resetDeviceId();
  return true;
}
