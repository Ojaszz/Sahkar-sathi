# Sahkar Sathi — System Architecture
### SIH 2025 · Problem Statement #26089 · Cooperative Gig-Services Platform

---

## 1 · High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SAHKAR SATHI                                │
│              Cooperative Gig-Services Platform                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌───────────┐    ┌───────────┐                                    │
│   │ CUSTOMER  │    │  WORKER   │   ← 2 Roles                        │
│   └─────┬─────┘    └─────┬─────┘                                    │
│         │                │                                            │
│         └────────────────┘                                            │
│                          ▼                                           │
│              ┌──────────────────────┐                                │
│              │   React Native +     │                                │
│              │   Expo SDK 57        │  ← Cross-platform mobile      │
│              │   (Expo Go)          │                                │
│              └──────────┬───────────┘                                │
│                         │                                            │
│         ┌───────────────┼───────────────────┐                        │
│         ▼               ▼                   ▼                        │
│  ┌─────────────┐ ┌────────────┐   ┌──────────────┐                  │
│  │ Zustand     │ │  Mock API  │   │  react-native │                 │
│  │ State Mgmt  │ │  (JSON)    │   │  -maps        │                │
│  └──────┬──────┘ └─────┬──────┘   └──────┬───────┘                  │
│         │              │                  │                           │
│         └──────────────┼──────────────────┘                          │
│                        ▼                                             │
│              ┌─────────────────────┐                                 │
│              │  AsyncStorage       │  ← Persistence layer            │
│              │  (device-local)     │                                 │
│              └─────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2 · Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Expo SDK 57 + Expo Go | Zero native build needed; instant QR-code deploy |
| **Framework** | React Native (Expo Router 7) | File-based routing, type-safe params |
| **State** | Zustand + AsyncStorage persistence | Lightweight, no boilerplate, survives app restart |
| **Maps** | react-native-maps v1.27 | MapView, Marker, Polyline — road tracking |
| **i18n** | Custom JSON dictionary (EN / HI / MR) | Trilingual out-of-the-box, no heavy lib |
| **Theming** | Mutable singleton `colors` + `makeStyles(colors)` factory | Dark/light mode via full-tree remount |
| **Navigation** | Expo Router file-based `<Stack>` | Role-based route groups, fullScreenModal for tracking |

---

## 3 · Frontend Architecture

### 3.1 Role-Based Route Groups (Expo Router)

```
app/
├── _layout.js                    ← Root Stack (auth gate, theme provider)
├── index.js                      ← Splash / role picker
├── auth/
│   ├── login.js                  ← Phone + role selection
│   └── register.js               ← Name, phone, city (Pune default)
├── (customer)/                   ← Customer tab group
│   ├── _layout.js                ← Bottom tabs
│   ├── index.js                  ← Home / dashboard
│   ├── search.js                 ← Service search + map view
│   ├── bookings.js               ← Booking list
│   ├── profile.js                ← Profile + saved addresses
│   └── booking/[id].js           ← Booking detail (track button)
├── (worker)/                     ← Worker tab group
│   ├── _layout.js                ← Bottom tabs
│   ├── index.js                  ← Active jobs + earnings
│   ├── jobs.js                   ← Available jobs feed
│   └── profile.js                ← Worker profile + rating
├── track/[id].js                 ← Live tracking (fullScreenModal)
└── emergency.js                  ← SOS / emergency screen
```

### 3.2 Component Hierarchy

```
App
├── ThemeProvider (key={theme} forces full remount)
│   └── AuthGate (checks authStore.isLoggedIn)
│       └── RoleSwitcher (floating pill — demo convenience)
│           └── Stack.Navigator
│               ├── AuthStack (login, register)
│               └── RoleStack
│                   ├── CustomerTabs
│                   │   ├── HomeScreen ← Card, Badge, ServiceGrid
│                   │   ├── SearchScreen ← MapView, ServiceCard
│                   │   ├── BookingsScreen ← BookingCard
│                   │   └── ProfileScreen ← Avatar, StatBox, MenuGroup
│                   ├── WorkerTabs
│                   │   ├── Dashboard ← EarningsCard, JobQueue
│                   │   └── JobsScreen ← JobCard, AcceptButton
│                   └── TrackScreen (fullScreenModal)
│                       ├── MapView (road polyline, markers)
│                       └── TrackingCard (live ETA, distance)
```

---

## 4 · State Management Architecture

### 4.1 Zustand Stores

```
┌─────────────────────────────────────────────────────────────┐
│                    ZUSTAND STORES                            │
├──────────────────┬──────────────────┬────────────────────────┤
│   authStore      │  bookingStore    │   trackingStore        │
│                  │                  │                        │
│  user: {}        │  bookings: []    │   live: {}             │
│  role: 'customer'│  loadBookings()  │   startTracking(b)     │
│  isLoggedIn: bool│  getById(id)     │   stopTracking(id)     │
│  login(user)     │  create(b)       │   getTracking(id)      │
│  logout()        │  updateStatus()  │   resetAll()           │
│  switchRole(r)   │                  │   [intervals Map]      │
└──────────────────┴──────────────────┴────────────────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
    ┌──────────────────────────────────────────────────┐
    │            AsyncStorage (persistence)             │
    │    auth: { user, role }                          │
    │    bookings: [ ...serializedBookings ]            │
    │    tracking: {} (NOT persisted — live only)      │
    └──────────────────────────────────────────────────┘
```

### 4.2 Data Flow — Booking Lifecycle

```
Customer books          Worker accepts         Worker starts job
     │                       │                       │
     ▼                       ▼                       ▼
 ┌────────┐            ┌────────┐             ┌────────────┐
 │requested│ ────────▶ │confirmed│ ────────▶  │ inProgress  │
 └────────┘            └────────┘             └──────┬──────┘
                                                     │
                                          trackingStore.startTracking()
                                          ┌──────────▼──────────┐
                                          │  Worker marker       │
                                          │  animates along      │
                                          │  road route toward   │
                                          │  customer            │
                                          └──────────┬──────────┘
                                                     │
                                              progress ≥ 1.0
                                                     │
                                              ┌──────▼──────┐
                                              │  completed   │
                                              └─────────────┘
```

---

## 5 · Live Tracking System (Zomato/Swiggy-Style)

This is the **hero feature** for the SIH demo.

### 5.1 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  LIVE TRACKING PIPELINE                       │
│                                                               │
│  ┌─────────────┐     ┌────────────────┐    ┌──────────────┐  │
│  │ worker.location│──▶│  roadPathFor() │──▶│  Route:      │  │
│  │ (base addr)  │    │  (zigzag city-  │    │  [p0, p1,    │  │
│  └─────────────┘    │   block path)   │    │   ... p8]    │  │
│                      └────────────────┘    └──────┬───────┘  │
│                                                    │          │
│  ┌─────────────┐     ┌────────────────┐            │          │
│  │ setInterval │────▶│ easeInOut(t)   │───┐        │          │
│  │ (700ms tick)│     │ (smooth motion)│   │        │          │
│  └─────────────┘     └────────────────┘   ▼        ▼          │
│                                    ┌────────────────────┐     │
│                                    │ pointAtPathFraction │     │
│                                    │ (arc-length interp) │     │
│                                    └────────┬───────────┘     │
│                                             │                  │
│                                    ┌────────▼───────────┐     │
│                                    │  workerPos: [lat,lng]   │
│                                    │  distance: 1.2 km       │
│                                    │  etaMin: 2              │
│                                    │  status: 'traveling'    │
│                                    └────────┬───────────┘     │
│                                             │                  │
│                                    ┌────────▼───────────┐     │
│                                    │  React State → UI   │     │
│                                    │  MapView.Marker      │     │
│                                    │  Polyline            │     │
│                                    │  TrackingCard readout │    │
│                                    └────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Key Algorithms

| Component | File | Purpose |
|-----------|------|---------|
| `roadPathFor(start, dest)` | `src/utils/geo.js` | Generates a deterministic 8-leg zigzag route (alternating lat/lng moves) using `mulberry32` seeded PRNG — stable across re-renders |
| `pointAtPathFraction(route, t)` | `src/utils/geo.js` | Arc-length parameterised interpolation — marker moves at constant speed along the zigzag, not faster on diagonals |
| `easeInOut(t)` | `src/utils/geo.js` | Quadratic ease-in-out for natural acceleration/deceleration |
| `pathLength(route)` | `src/utils/geo.js` | Sum of haversine distances between consecutive route points |
| `remainingPathDistance(route, t)` | `src/utils/geo.js` | Road distance remaining = `totalKm × (1 − t)` |
| `customerLocationFor(booking)` | `src/utils/geo.js` | Deterministic customer coordinate from `USER_LOCATION + hash(booking.id)` — no GPS needed |

### 5.3 Tracking Card (Bottom Sheet)

```
┌──────────────────────────────────────┐
│  ─── (handle bar)                    │
│                                      │
│  ● LIVE          👨‍🔧 Rajesh · Plumbing│
│                                      │
│  ┌────────────────────────────────┐  │
│  │    1.2 km away                 │  │  ← Decreases in real-time
│  │    Arriving in ~2 min          │  │  ← ETA countdown
│  └────────────────────────────────┘  │
│                                      │
│  Worker is on the way   [progress]   │
│                                      │
└──────────────────────────────────────┘
```

---

## 6 · Mock Backend Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    MOCK DATA LAYER                            │
│                                                               │
│  src/data/                                                    │
│  ├── workers.js    24 workers (Pune coords)                   │
│  │                  { id, name, service, rating,              │
│  │                    avatar (emoji), languages,              │
│  │                    location: [lat, lng] }                  │
│  │                                                            │
│  ├── services.js   8 service categories                       │
│  │                  { id, name, icon, basePrice, color }      │
│  │                                                            │
│  └── bookings.js   8 seeded bookings                          │
│                     { id, service, workerId, customerId,      │
│                       status, address, amount, coopFee,      │
│                       createdAt }                             │
│                                                               │
│  Persistence: AsyncStorage (survives app close/reopen)        │
│  Reset: logout clears all stores + intervals                  │
└──────────────────────────────────────────────────────────────┘

Service Categories:
  🔧 Plumbing    🏠 Cleaning    ⚡ Electrical   🌳 Gardening
  🔨 Carpentry   🎨 Painting    📦 Moving       🛠️ General Repair
```

---

## 7 · Trilingual i18n System

```
┌────────────────────────────────────────────────────┐
│                TRANSLATION PIPELINE                  │
│                                                     │
│  src/i18n/                                          │
│  ├── index.js     ← t('key') function               │
│  ├── en.json      ← English (base)                  │
│  ├── hi.json      ← Hindi / हिंदी                   │
│  └── mr.json      ← Marathi / मराठी                  │
│                                                     │
│  Usage:  t('tracking.kmAway', { km: 1.2 })          │
│  Output: "1.2 km away" / "1.2 किमी दूर" / "१.२ किमी दूर" │
│                                                     │
│  Namespace convention: 'category.key'               │
│    bookings.trackWorker, workerApp.accept,           │
│    tracking.live, bookings.trackWorker, home.heroTitle│
└────────────────────────────────────────────────────┘
```

---

## 8 · Theming & Dark Mode

```
┌──────────────────────────────────────────────────────────┐
│               THEME SYSTEM                                │
│                                                           │
│  src/theme/                                               │
│  ├── colors.js   ← LIGHT_COLORS, DARK_COLORS             │
│  ├── typography.js← caption, body, h1, h2, h3            │
│  ├── spacing.js  ← xs, sm, md, lg, xl                   │
│  └── radius.js   ← sm, md, lg, xl, round                │
│                                                           │
│  Pattern: mutable singleton `colors` + `makeStyles(colors)` │
│                                                           │
│  User toggles dark mode:                                  │
│    colors = isDark ? DARK_COLORS : LIGHT_COLORS           │
│    theme = isDark ? 'dark' : 'light'                      │
│    <View key={theme}>...</View>  ← forces full remount    │
│                                                           │
│  All components call makeStyles(colors) at render time.   │
│  Every StyleSheet lives in a factory, not a static object.│
└──────────────────────────────────────────────────────────┘
```

---

## 9 · Data Model

### Workers (24 across Pune)

```js
{
  id: 'w1',
  name: 'Rajesh Kumar',
  service: 'plumbing',
  rating: 4.8,
  completedJobs: 156,
  avatar: '👨‍🔧',
  languages: ['Hindi', 'Marathi', 'English'],
  location: [18.5223, 73.8504],  // Shivajinagar, Pune
  available: true,
  hourlyRate: 350
}
```

### Bookings

```js
{
  id: 'b1',
  service: 'plumbing',
  workerId: 'w1',
  customerId: 'c1',
  status: 'requested' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled',
  address: '12, FC Road, Pune',
  amount: 850,
  coopFee: 85,           // 10% to welfare fund
  createdAt: '2025-09-01T10:00:00Z'
}
```

### Tracking (live, in-memory only)

```js
{
  bookingId: 'b1',
  workerStart: [18.5223, 73.8504],
  customer: [18.5204, 73.8567],
  route: [[lat, lng], ...],    // 9-point zigzag road path
  progress: 0.45,              // 0..1
  workerPos: [lat, lng],       // current interpolated position
  distance: 0.8,               // km remaining (road distance)
  etaMin: 1,                   // minutes remaining
  status: 'traveling'          // 'traveling' | 'arrived'
}
```

---

## 10 · Cooperative Model (Problem Statement Core)

```
┌─────────────────────────────────────────────────────────────┐
│              COOPERATIVE REVENUE MODEL                       │
│                                                              │
│  Customer pays ₹850 for plumbing service                     │
│          │                                                   │
│          ├──▶ 92% → Worker earnings (₹782)                  │
│          │       ├── Direct income                           │
│          │       ├── Skill training fund                     │
│          │       └── Insurance coverage                      │
│          │                                                   │
│          └──▶ 8% → Cooperative welfare fund (₹68)           │
│                  ├── Worker insurance pool                   │
│                  ├── Emergency assistance                    │
│                  ├── Community development                   │
│                  └── Platform maintenance                    │
│                                                              │
│  ✓ NO investor dividends                                     │
│  ✓ NO commission extraction                                  │
│  ✓ 100% surplus reinvested in workers                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 11 · Key Differentiators (for SIH Judges)

| Feature | What It Solves | How |
|---------|---------------|-----|
| **Trilingual UI** | Exclusion of non-English workers | EN/HI/MR with cultural tone matching |
| **Cooperative model** | Exploitative gig-platform commissions | 92% worker share, 8% welfare fund |
| **Role switcher** | Demo convenience + multi-stakeholder view | One app, two perspectives |
| **Live tracking** | Customer trust & worker accountability | Zomato-style road-following simulation |
| **No AI dependency** | Accessibility in low-connectivity areas | Offline-first mock backend |
| **Dark mode** | Usability for outdoor/night workers | Full theme system, per-component |
| **Worker dashboard** | Financial transparency | Earnings, jobs, ratings at a glance |

---

## 12 · Demo Flow (5-Minute Pitch Script)

```
Step 1  ──▶  Open app → Splash screen (सहकार साथी branding)
Step 2  ──▶  Login as Demo Customer (phone auto-fill)
Step 3  ──▶  Browse services → Plumbing tile → Search screen with map
Step 4  ──▶  Book a plumber → Confirm booking
Step 5  ──▶  Switch to Demo Worker (role switcher pill)
Step 6  ──▶  Accept the job → Start job (status → inProgress)
Step 7  ──▶  Switch back to Customer → Open booking → "Track Worker"
Step 8  ──▶  ★ LIVE TRACKING SCREEN ★
              • Worker marker moves along roads on map
              • Distance counts down: 1.2 km → 0.8 → 0.3 → arrived
              • ETA updates in real-time
              • "Worker has arrived" with checkmark
Step 9  ──▶  Toggle dark mode → Entire app re-themes
Step 10 ──▶  Switch to हिंदी → All labels translate instantly
Step 11 ──▶  Q&A
```

---

## 13 · Project File Tree

```
sahkar-sathi/
├── app/                          ← Expo Router file-based routes
│   ├── _layout.js                ← Root Stack, auth gate, role switcher
│   ├── index.js                  ← Splash screen
│   ├── emergency.js              ← SOS screen
│   ├── auth/
│   │   ├── login.js
│   │   └── register.js
│   ├── (customer)/
│   │   ├── _layout.js            ← Customer bottom tabs
│   │   ├── index.js              ← Home dashboard
│   │   ├── search.js             ← Service search + map
│   │   ├── bookings.js           ← Booking list
│   │   ├── profile.js            ← Customer profile
│   │   └── booking/[id].js       ← Booking detail + track button
│   ├── (worker)/
│   │   ├── _layout.js            ← Worker bottom tabs
│   │   ├── index.js              ← Worker dashboard
│   │   ├── jobs.js               ← Available jobs
│   │   └── profile.js            ← Worker profile
│   └── track/[id].js             ← ★ Live tracking (fullScreenModal)
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── index.js          ← Screen, Card, Button, Badge, etc.
│   │   │   ├── Avatar.js         ← Emoji avatar component
│   │   │   ├── Button.js         ← Themed button (makeStyles injected)
│   │   │   ├── Header.js         ← App header bar
│   │   │   └── StatusBadge.js    ← Status pill component
│   │   ├── booking/
│   │   │   └── BookingCard.js    ← Booking summary card
│   │   └── tracking/
│   │       └── TrackingCard.js   ← ★ Live tracking bottom sheet
│   │
│   ├── store/
│   │   ├── authStore.js          ← Auth + role switching
│   │   ├── bookingStore.js       ← Bookings CRUD + persistence
│   │   └── trackingStore.js      ← ★ Live tracking simulation engine
│   │
│   ├── data/
│   │   ├── workers.js            ← 24 Pune workers (coords + profiles)
│   │   ├── services.js           ← 8 service categories
│   │   └── bookings.js           ← 8 seeded bookings
│   │
│   ├── utils/
│   │   ├── constants.js          ← USER_LOCATION (Pune), demo users
│   │   ├── format.js             ← Currency, date formatters
│   │   └── geo.js                ← ★ Haversine, road path, tracking math
│   │
│   ├── theme/
│   │   ├── colors.js             ← Light + dark palettes
│   │   ├── typography.js         ← Font scale
│   │   ├── spacing.js            ← 4px grid system
│   │   └── radius.js             ← Border radii
│   │
│   └── i18n/
│       ├── index.js              ← t() translation function
│       ├── en.json               ← English
│       ├── hi.json               ← Hindi
│       └── mr.json               ← Marathi
│
├── assets/                       ← Icons, splash, fonts
├── app.json                      ← Expo config
├── babel.config.js               ← Babel + reanimated plugin
└── package.json                  ← Dependencies
```

---

## 14 · Dependencies

| Package | Purpose |
|---------|---------|
| `expo` ~57 | Core SDK |
| `expo-router` ~7 | File-based navigation |
| `react-native-maps` 1.27 | MapView, Marker, Polyline |
| `zustand` | State management |
| `@react-native-async-storage/async-storage` | Local persistence |
| `@expo/vector-icons` | MaterialCommunityIcons |
| `react-native-safe-area-context` | Dynamic island / notch insets |
| `react-native-gesture-handler` | Swipe + drag gestures |
| `react-native-reanimated` | Smooth animations |
| `expo-font` | Custom typography |

---

*Prepared for Smart India Hackathon 2025 — Problem Statement #26089*
*Sahkar Sathi (सहकार साथी) — Empowering Gig Workers Through Cooperative Principles*
