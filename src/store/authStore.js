import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_USERS } from '../utils/constants';
import { supabase, supabaseAuth, deviceId } from '../lib/supabase';
import { useTrackingStore } from './trackingStore';
import { useWorkerDirectoryStore } from './workerDirectoryStore';
import { getService } from '../data/services';
import { workerArea } from '../data/workers';
import { areaByKey } from '../utils/puneAreas';

// Supabase user -> the app's local user shape the rest of the UI expects.
// Worker-profile fields (service/skills/certifications/serviceAreas/languages/
// experienceYears/rate/onboarded) are filled by the onboarding wizard and restored
// from user_metadata on a later sign-in.
function appUser(supabaseUser, meta = {}) {
  const role = meta.role || 'customer';
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: meta.name || (supabaseUser.email || 'User').split('@')[0],
    phone: meta.phone || '',
    role,
    location: meta.location || 'Pune',
    avatar: role === 'worker' ? '👨‍🔧' : '👤',
    service: meta.service || '',
    skills: Array.isArray(meta.skills) ? meta.skills : [],
    certifications: Array.isArray(meta.certifications) ? meta.certifications : [],
    serviceAreas: Array.isArray(meta.serviceAreas) ? meta.serviceAreas : [],
    languages: Array.isArray(meta.languages) ? meta.languages : [],
    experienceYears: meta.experienceYears || '',
    rate: Number(meta.rate) || 0,
    onboarded: !!meta.onboarded,
  };
}

const KEY = 'ss_auth_v1';

export const useAuthStore = create((set, get) => ({
  user: null, // { id, name, phone, role, email, location, avatar }
  isAuthenticated: false,
  hasVisited: false,
  loading: true,

  markVisited: () => {
    set({ hasVisited: true });
    AsyncStorage.setItem('ss_visited_v1', 'true').catch(() => {});
  },

  restoreSession: async () => {
    try {
      const [stored, visited] = await Promise.all([
        AsyncStorage.getItem(KEY),
        AsyncStorage.getItem('ss_visited_v1'),
      ]);
      if (stored) {
        const user = JSON.parse(stored);
        set({ user, isAuthenticated: true, hasVisited: visited === 'true', loading: false });
        return;
      }
      set({ hasVisited: visited === 'true', loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  login: async (user) => {
    set({ user, isAuthenticated: true });
    await AsyncStorage.setItem(KEY, JSON.stringify(user));
  },

  loginAsDemo: async (role) => {
    let user = { ...DEMO_USERS[role], isDemo: true };
    // The customer's board identity is this phone's device id (that's the
    // `customer_id` the sync engine stamps on bookings + messages), so align the
    // logged-in id with it — otherwise the chat threads never match up.
    if (role === 'customer') user.id = await deviceId();
    await get().login(user);
    return user;
  },

  // Instant demo-worker login (no typing, no password — "credential free" demo).
  // Logs in with the worker's real name + service so every screen reads like a
  // genuine account. Uses the static worker id so getWorker() keeps resolving.
  loginAsDemoWorker: async (w) => {
    const user = {
      id: w.id,
      name: w.name,
      phone: `+91 9${String(Math.floor(100000000 + Math.random() * 899999999))}`,
      role: 'worker',
      email: `${w.id}@coop.in`,
      location: workerArea(w.id),
      avatar: w.avatar,
      service: w.service,
      isDemo: true,
    };
    await get().login(user);
    return user;
  },

  // Real email/password sign-in against Supabase Auth.
  supabaseSignIn: async (email, password) => {
    const res = await supabaseAuth.signIn(email, password);
    if (!res.user) throw new Error('No user returned — is "Confirm email" off in Supabase?');
    const meta = res.user.user_metadata || {};
    const user = appUser(res.user, meta);
    await get().login(user);
    return user;
  },

  // Create a real Supabase account (name + role go into user_metadata so a later
  // sign-in can rebuild the same app profile).
  supabaseSignUp: async ({ email, password, name, role, location, phone }) => {
    const res = await supabaseAuth.signUp(email, password, { name, role, location, phone });
    if (!res.user) throw new Error('Account created but no session — turn OFF "Confirm email" in Supabase Auth → Providers → Email.');
    const user = appUser(res.user, { name, role, location, phone });
    await get().login(user);
    return user;
  },

  updateProfile: async (patch) => {
    const next = { ...get().user, ...patch };
    set({ user: next });
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  },

  // The onboarding wizard / profile-edit screen calls this with the completed worker
  // profile (service, skills, trainings, service areas, languages, experience).
  // Saved locally (AsyncStorage) immediately + pushed to Supabase user_metadata
  // (re-sign-in restores it) + published to the worker_profiles board so CUSTOMERS
  // can see this new worker in their search. All best-effort.
  completeWorkerProfile: async (fields) => {
    const user = get().user;
    await get().updateProfile({ ...fields, onboarded: true });
    const rate = Number(fields.rate) || (user.service ? getService(user.service).price : 250);
    const meta = {
      role: user?.role,
      name: user?.name,
      service: fields.service || '',
      skills: fields.skills || [],
      certifications: fields.certifications || [],
      serviceAreas: fields.serviceAreas || [],
      languages: fields.languages || [],
      experienceYears: fields.experienceYears || '',
      rate,
      onboarded: true,
    };
    try {
      await supabaseAuth.updateUser(meta);
    } catch {
      /* best-effort; local copy already saved */
    }
    // Publish a public profile row so customer phones can find this worker on the
    // search/home screens (the table is created by docs/worker-profiles.sql).
    await get().publishWorkerProfile(user?.id, meta);
  },

  // Upsert this worker's public profile (id, service, skills, rate, location…) into
  // the `worker_profiles` board. Used by the customer search; best-effort.
  publishWorkerProfile: async (id, p) => {
    if (!id || !p?.service || !p?.name) return;
    const area = p.serviceAreas?.[0] ? areaByKey(p.serviceAreas[0]) : null;
    const profile = {
      id,
      name: p.name,
      service: p.service,
      avatar: '👨‍🔧',
      skills: p.skills || [],
      certifications: p.certifications || [],
      service_areas: p.serviceAreas || [],
      languages: p.languages || [],
      experience_years: p.experienceYears || '',
      rate: Number(p.rate) || (p.service ? getService(p.service).price : 250),
      location_lat: area?.lat ?? 18.5204,
      location_lng: area?.lng ?? 73.8567,
      available: true,
      is_fair_wage: true,
      created_at: new Date().toISOString(),
    };
    useWorkerDirectoryStore.getState().mergeRemote([profile]);
    try {
      await supabase.upsert('worker_profiles', profile, 'id');
    } catch {
      /* best-effort */
    }
  },

  logout: async () => {
    useTrackingStore.getState().resetAll(); // stop any live tracking sims
    await AsyncStorage.removeItem(KEY);
    set({ user: null, isAuthenticated: false });
  },
}));