# Same-WiFi Demo Board (zero Supabase)

The entire app — **booking, chat, emergency** — can sync across 4 phones on the
same WiFi using a tiny Node server on the demo laptop.  No Supabase account,
SQL, or internet needed.

---

## 1 · Start the board

```bash
cd ~/Desktop/sahkar\ sathi
node server/board.js
```

It prints:

```
  Sahkar Sathi — same-WiFi demo board
  ------------------------------------
  Existing live here:  http://localhost:4000
  Phones point at:     http://192.168.x.x:4000    ← use THIS address
```

Keep this terminal open for the whole demo.  `Ctrl+C` stops it.
Data lives in memory — a fresh restart clears the board.

---

## 2 · Point each phone at the board

On each phone, in Expo Go:

1. Open the role-setup screen ("4-Phone Demo Setup").
2. In the **Same-WiFi demo board** card, enter the `http://…` address
   printed by the server.
3. Tap **Set & check** → green ✓ means the phone can reach the board.
4. Pick a role (Customer / any Worker) and continue.

All 4 phones should use the SAME address.  Only one can be "Customer";
the others each pick a different worker.

---

## 3 · Demo the flow

| Step | On which phone |
|------|----------------|
| Book a service (repair / plumbing / …) | Customer |
| See it appear live | Worker |
| Tap **Accept** | Worker |
| See the booking status update | Customer |
| Use the chat thread between customer ↔ worker | Both |
| Mark job in progress → complete | Worker |
| Pay + rate | Customer |
| Fire an emergency SOS (SOS screen) | Customer |
| See the emergency ringing overlay | Workers |
| Worker accepts the emergency | Worker |

Everything syncs in ~1.5 seconds.

---

## Troubleshooting

**Phones can't reach the board**
- Confirm the laptop and all phones are on the **same WiFi network**.
- macOS firewall: when prompted, allow `node` to accept incoming
  connections (System Settings → Network → Firewall → Options).
- Run `curl http://192.168.x.x:4000/` from the laptop itself to
  verify the address.

**"✗ Could not reach this board" on the phone**
- Check for typos — include `http://` and the port.
- Confirm `node server/board.js` is still running and shows the address.

**Data disappears after restart**
- The board keeps data in RAM only — this is by design so every
  presentation starts with a clean slate.  Use "Start fresh" in the
  app to clear during the demo.

---

## How it works under the hood

The board is a 200-line Node HTTP server that mirrors the exact PostgREST
REST surface the app's `src/lib/supabase.js` already calls:

| Method | Path | What it does |
|--------|------|-------------|
| `GET` | `/rest/v1/<table>?…` | Poll bookings / messages / emergencies |
| `POST` | `/rest/v1/<table>` | Create booking / send message |
| `PATCH` | `/rest/v1/<table>?filter` | Update status / payment |
| `POST` | `/rest/v1/<table>?on_conflict=id` | Upsert worker profile |
| `DELETE` | `/rest/v1/<table>?filter` | Start fresh |
| `GET` | `/` | Health check |

The role-setup screen stores the chosen board URL in AsyncStorage
(`ss_board_url`).  The data layer reads it per-request, so switching
between the local board and Supabase takes effect on the very next poll
with no app restart required.
