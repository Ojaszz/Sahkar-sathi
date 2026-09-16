// Geo helpers for the live-tracking demo.
// Bookings store only a free-text address (no coordinates), so the customer's
// position is derived deterministically from USER_LOCATION + a stable per-booking
// offset — this keeps it consistent across renders and works for seeded bookings.

import { USER_LOCATION } from './constants';

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic mock customer location (~0.5–2 km from the home base, FC Road, Pune)
export function customerLocationFor(booking) {
  const h = hashStr(booking?.id || 'unknown');
  const lat = USER_LOCATION[0] + (((h % 100) / 100) - 0.5) * 0.03; // ±~1.6 km lat
  const lng = USER_LOCATION[1] + ((((h >> 8) % 100) / 100) - 0.5) * 0.03; // ±~1.6 km lng
  return [lat, lng];
}

// Numeric haversine distance in km between two [lat, lng] points
export function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Ease-in-out for natural-feeling marker motion
export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Linear interpolation between two [lat, lng] points at t in [0, 1]
export function interpolate(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Deterministic seeded PRNG (mulberry32) so a route is stable across re-renders
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a plausible street route between two points: a monotonic, alternating
// lat/lng "city-block" path with a few turns (deterministic per route). This makes
// the worker look like they're driving along roads rather than flying straight.
export function roadPathFor(start, customer) {
  const dLat = customer[0] - start[0];
  const dLng = customer[1] - start[1];
  const seed = hashStr(`${start[0]},${start[1]}|${customer[0]},${customer[1]}`);
  const rnd = mulberry32(seed);
  const turns = 8;
  const pts = [[start[0], start[1]]];
  let lat = start[0];
  let lng = start[1];
  let latRem = dLat;
  let lngRem = dLng;
  for (let i = 0; i < turns; i++) {
    const horizontal = i % 2 === 0;
    const f = 0.4 + rnd() * 0.5; // take 40–90% of the remaining delta this leg
    if (horizontal) {
      lng += lngRem * f;
      lngRem = customer[1] - lng;
    } else {
      lat += latRem * f;
      latRem = customer[0] - lat;
    }
    pts.push([lat, lng]);
  }
  // snap the final leg exactly onto the destination
  pts[pts.length - 1] = [customer[0], customer[1]];
  return pts;
}

// Nearest Pune area from a GPS coordinate.  Returns the full area object from
// PUNE_AREAS ({ area, pincode, lat, lng }) closest to the given [lat, lng].
export function nearestArea(coords) {
  const { PUNE_AREAS } = require('./puneAreas');
  let best = null;
  let bestDist = Infinity;
  for (const a of PUNE_AREAS) {
    const d = distanceKm(coords, [a.lat, a.lng]);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}

// Use expo-location (already installed) to get the device's current position and
// return the nearest Pune area.  Returns { area, pincode } or null on failure.
// Caller must request permission BEFORE calling this — or let the caller
// handle the permission prompt and call this on success.
export async function getCurrentArea() {
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const area = nearestArea([pos.coords.latitude, pos.coords.longitude]);
    return area ? { area: area.area, pincode: area.pincode, lat: area.lat, lng: area.lng } : null;
  } catch {
    return null;
  }
}

// Total path length (km) along a polyline of [lat, lng] points
export function pathLength(points) {
  let s = 0;
  for (let i = 1; i < points.length; i++) s += distanceKm(points[i - 1], points[i]);
  return s;
}

// Point at `frac` (0..1) of the total path length (arc-length parameterised),
// interpolating within the segment that contains it.
export function pointAtPathFraction(points, frac) {
  const total = pathLength(points);
  const target = frac * total;
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = distanceKm(points[i - 1], points[i]);
    if (acc + seg >= target || i === points.length - 1) {
      const t = seg === 0 ? 0 : Math.min(1, Math.max(0, (target - acc) / seg));
      return interpolate(points[i - 1], points[i], t);
    }
    acc += seg;
  }
  return points[points.length - 1];
}

// Road distance (km) remaining along the path after travelling `frac` of it
export function remainingPathDistance(points, frac) {
  return pathLength(points) * (1 - frac);
}
