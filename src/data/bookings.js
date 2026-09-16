// Mock bookings
// status: requested | confirmed | inProgress | completed | cancelled
// payment: pending | paid

const B = (id, customerId, customerName, workerId, service, date, time, amount, status, payment, issue, address, rating = null, review = null) => ({
  id,
  customerId,
  customerName,
  workerId,
  service,
  date,
  time,
  amount,
  status,
  payment,
  issue,
  address,
  rating,
  review,
  coopFee: Math.round(amount * 0.08), // 8% cooperative fair-wage support fee
  createdAt: new Date().toISOString(),
});

export const SAMPLE_BOOKINGS = [
  B('b1', 'cust1', 'Ojas', 'w3', 'plumber', '2026-09-06', '10:00 AM', 450, 'inProgress', 'pending', 'Kitchen sink leaking, water collecting under the cabinet', '12, FC Road, Pune', null),
  B('b2', 'cust1', 'Ojas', 'w1', 'electrician', '2026-09-07', '02:00 PM', 500, 'confirmed', 'pending', 'Need new switch board and two extra sockets in the living room', '12, FC Road, Pune', null),
  B('b3', 'cust2', 'Rohit Verma', 'w12', 'cleaner', '2026-09-05', '09:00 AM', 600, 'completed', 'paid', 'Full home deep cleaning before moving out', '45, Kothrud, Pune', 5, 'Excellent deep cleaning, very thorough!'),
  B('b4', 'cust1', 'Ojas', 'w5', 'domestic', '2026-09-04', '08:00 AM', 400, 'completed', 'paid', 'Daily cooking help for a week', '12, FC Road, Pune', 4, 'Good cook, punctual.'),
  B('b5', 'cust3', 'Meera Iyer', 'w8', 'caregiver', '2026-09-08', '11:00 AM', 900, 'requested', 'pending', 'Elderly care for my mother, 6 hours, evening shift', '8, Koregaon Park, Pune', null),
  B('b6', 'cust1', 'Ojas', 'w9', 'electrician', '2026-09-02', '04:00 PM', 350, 'completed', 'paid', 'Fan stopped working in bedroom', '12, FC Road, Pune', 5, 'Fixed quickly, very professional.'),
  B('b7', 'cust2', 'Rohit Verma', 'w7', 'painter', '2026-09-03', '10:00 AM', 1200, 'cancelled', 'pending', 'Painting one bedroom wall', '45, Kothrud, Pune', null),
];

export function sampleBookingsForCustomer(customerId) {
  return SAMPLE_BOOKINGS.filter((b) => b.customerId === customerId);
}

export function sampleBookingsForWorker(workerId) {
  return SAMPLE_BOOKINGS.filter((b) => b.workerId === workerId);
}

export const STATUS_ORDER = ['requested', 'confirmed', 'inProgress', 'completed', 'cancelled'];
