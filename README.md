# सहकार साथी — Sahkar Sathi

**Cooperative Gig Services Platform for Household & Community Services**
_SIH 2025 • Problem Statement ID 26089 • Demo Prototype_

A **cooperative-owned** digital service marketplace that connects Labour Cooperative
Federations / Societies with households & institutions — ensuring **fair wages, worker
welfare, insurance**, and consumer trust. This is a full **demo-mode** prototype
(frontend + mock backend) built with **React Native + Expo SDK 57**.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Fix any Expo SDK 57 version mismatches (auto-resolves correct versions)
npx expo install --fix

# 3. Start the dev server
npx expo start
```

Then scan the QR code with the **Expo Go** app (Android) or open in the iOS Simulator.

> The app runs **100% offline** — all data (workers, bookings, payments, chats,
> booking and chat data is served by an in-app mock backend. No server is needed.

## 🎭 Demo accounts

The login screen has one-tap demo entry for both roles:

| Role | Button | What you see |
|---|---|---|
| 🙋 **Customer** | Demo Customer | Book iservices, search/map, payments, reviews, chat |
| 🔧 **Worker** | Demo Worker | Job requests, accept/reject, earnings, insurance |

OTP flow: any 10-digit number → use **`123456`**.

---

## 📱 What's inside (features)

### Customer
- Home with service categories (Electrician, Plumber, Carpenter, Painter, Cleaner, Caregiver, Driver, Gardener, Technician, Domestic Help)
- Worker search + **map view (geo-spatial)** + filters (rating/distance/price/availability)
- Worker profiles with skills, certifications, **insurance**, reviews, fair-wage badge
- Booking flow (date/time picker, price summary) → payment (UPI/Card/Cash) → invoice
- Booking tracking with status timeline, cancellation, rating & review
- 🛰️ **Live "worker on the way" tracking** — animated map with real-time distance
  ("2.3 km away"), ETA countdown, and arrival detection (demo-simulated movement)
- In-app chat with workers
- **Emergency / SOS** service request

### Worker
- Dashboard: today's schedule, new requests, earnings, availability toggle
- Job requests: accept / decline
- Job detail with customer location & open-in-Maps
- Earnings: monthly net, **cooperative contribution ledger**, payout history
- Insurance & welfare card (cooperative-sponsored, transparent)
- In-app chat with customers

### Cross-cutting
- 🌐 **Trilingual**: English / हिंदी / मराठी (toggle in Profile → Language)
- 🌙 **Dark mode** on/off switch (Profile → Dark mode) — full palette flip
- 🔔 Notifications (booking/job/payment updates)
- 💬 Chat, 📍 geo-location matching, 🚨 Emergency SOS

---

## 🆚 Why this is different from Urban Company (SIH talking points)

| | Urban Company | **Sahkar Sathi** |
|---|---|---|
| Ownership | Private, VC-backed | **Worker-owned cooperative** |
| Workers | Gig workers, platform controls terms | **Member-owners** with a voice |
| Wages | Opaque commission | **Fair-wage share: 92% to worker, transparent** |
| Welfare | Afterthought | **Insurance & welfare fund are built-in core features** |
| Trust | Corporate background check | **Federation verification + community presence** |
| Reach | Big-city professionals | **Grassroots / semi-urban cooperative workforce** |

**One-line pitch:** *"Urban Company connects you to a gig worker. Sahkar Sathi
connects you to a member-owned cooperative — where the worker is also the owner,
wages are fair, welfare is built in, and everyone benefits as a member-owner."*

---

## 🏗️ Tech stack

- **React Native + Expo SDK 57** (Expo Go compatible)
- **Expo Router** (file-based navigation)
- **Zustand** (state) + **AsyncStorage** (mock persistence)
- **Mock backend** in `src/services/mockApi.js` — swap for a real REST backend later
- `react-native-maps` (geo-spatial), `react-native-chart-kit`/SVG (analytics)
- Custom design system in `src/theme/`

> Note: Per the project brief, this prototype **excludes AI**. Demand/analytics use
> static sample data. The problem statement's "AI-based demand forecasting +
> workforce allocation" can be layered on top of the analytics screens later.

## 📁 Key files

```
app/_layout.js            → splash + auth gate + router
src/services/mockApi.js   → all mock backend endpoints
src/data/workers.js       → 24 cooperative worker profiles
src/data/bookings.js      → sample bookings across all statuses
src/i18n/{en,hi,mr}.json  → translations
src/store/                → auth/booking/worker/chat/notifications stores
```

## 🧪 Verifying end-to-end (demo script)

1. Open app → **Demo Customer**
2. Book a plumber (search → profile → Book now → confirm)
3. Payment → UPI → success + invoice
4. Profile → Switch role → **Demo Worker** → accept the job → start
5. Switch role → **Demo Customer** → open the booking → **Track booking** → watch the
   worker move on the live map, "2.3 km away" counting down → "Worker has arrived"
6. Switch role → **Demo Worker** → mark complete
7. Profile → Language → हिंदी / मराठी → entire app switches
8. Home → Emergency → SOS flow

---
_Made for Smart India Hackathon (SIH) • Problem Statement 26089_
