// App-wide constants

// Demo user that maps to sample bookings
export const DEMO_USERS = {
  customer: {
    id: 'cust1',
    name: 'Ojas',
    phone: '+91 98765 43210',
    role: 'customer',
    email: 'ojas@example.com',
    location: 'FC Road, Pune',
    avatar: '👨',
  },
  worker: {
    id: 'w1',
    name: 'Vardhan',
    phone: '+91 98450 12345',
    role: 'worker',
    email: 'vardhan@coop.in',
    location: 'FC Road, Pune',
    avatar: '👨‍🔧',
  },
};

export const DEMO_OTP = '123456';

// User's "home" location (mock) for distance calculations — FC Road, Pune
export const USER_LOCATION = [18.5204, 73.8567];

// Cooperative specifics
export const COOP_FEE_PERCENT = 8;

// Emergency pay bonus — workers who accept an SOS get 20 % extra.
export const EMERGENCY_PAY_MULTIPLIER = 1.2;

// Tag-along loop: after this many COMPLETED shared jobs the junior "graduates" —
// the feature closes (no more requests) because their rating stands on its own.
export const TAG_ALONG_LIMIT = 10;

// Booking time slots
export const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM',
];

// Insurance policies shown on worker profile
export const INSURANCE_POLICIES = [
  { name: 'Life Cover', detail: 'On duty & off duty coverage' },
  { name: 'Accident Cover', detail: 'Injury while at work' },
  { name: 'Hospitalisation', detail: 'Medical expenses support' },
  { name: 'Coop Welfare Fund', detail: 'Skill upgrades & support' },
];
