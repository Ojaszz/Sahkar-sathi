// Mock cooperative worker profiles — Pune area
// location: [latitude, longitude]
//
// The demo catalogue: exactly 5 "known" cooperation members, all available in Pune.
// Every other screen (search, emergency, tag-along mentors) reads this list, so the
// judge demo only ever sees these five faces.

const W = (id, name, avatar, service, rating, reviews, jobs, price, distance, available, exp, memberSince, loc, languages, about, skills, certs, insurance, status = 'verified') => ({
  id,
  name,
  avatar,
  service,
  rating,
  reviewsCount: reviews,
  jobsCompleted: jobs,
  price,
  distance,
  available,
  yearsExp: exp,
  memberSince,
  location: loc,
  languages,
  about,
  skills,
  certifications: certs,
  insuranceCover: insurance,
  status, // verified | pending | suspended
  isFairWage: true,
});

export const WORKERS = [
  W('w1', 'Vardhan', '👨‍🔧', 'electrician', 4.9, 132, 410, 250, 1.2, true, 12, 2016, [18.5223, 73.8504], ['Hindi', 'Marathi', 'English'], 'Certified electrician with 12 years of experience in residential and commercial wiring, safety-focused and punctual.', ['Wiring', 'Switch & socket', 'Appliance repair'], ['ITI Electrical', 'BIS License'], '₹5,00,000 life + accident'),
  W('w2', 'Swaraj', '👨‍🔧', 'plumber', 4.8, 96, 320, 300, 2.1, true, 8, 2018, [18.511, 73.8754], ['Marathi', 'Hindi'], 'Smooth, dependable plumber for tap, pipeline and bathroom fitting work — honest quotes.', ['Tap & mixer repair', 'Pipeline fitting', 'Toilet & bathroom'], ['ITI Plumbing', 'NSDC Certified'], '₹3,00,000 life cover'),
  W('w3', 'Sidhhi', '👩‍⚕️', 'caregiver', 5.0, 64, 170, 450, 3.4, true, 9, 2018, [18.5204, 73.8567], ['Hindi', 'Marathi', 'English'], 'Compassionate caregiver with nursing training, experienced in elderly, patient and post-surgery care.', ['Elderly care', 'Patient care', 'Post-surgery care'], ['Certified Caregiver', 'First Aid & CPR'], '₹5,00,000 life + accident'),
  W('w4', 'Hitarth', '👨‍🔧', 'technician', 4.6, 74, 210, 350, 1.8, true, 11, 2015, [18.5404, 73.8967], ['Marathi', 'Hindi', 'English'], 'AC and appliance repair specialist covering split ACs, refrigerators and washing machines.', ['AC service', 'Refrigerator', 'Washing machine'], ['AC Technician Certified', 'Refrigerant Handling'], '₹5,00,000 life + accident'),
  W('w5', 'Neel', '🧹', 'cleaner', 4.8, 89, 250, 200, 2.4, true, 7, 2019, [18.5124, 73.8517], ['Hindi', 'Marathi', 'English'], 'Trusted deep-cleaning expert providing thorough, chemical-safe home cleaning, always on time.', ['Deep cleaning', 'Kitchen cleaning', 'Bathroom cleaning'], ['Cleaning Safety Certified'], '₹3,00,000 life cover'),
];

// Display locality shown when a demo worker logs in / registers a profile.
const WORKER_AREAS = {
  w1: 'FC Road, Pune',
  w2: 'Shivajinagar, Pune',
  w3: 'FC Road, Pune',
  w4: 'Kothrud, Pune',
  w5: 'Deccan, Pune',
};

export function workerArea(id) {
  return WORKER_AREAS[id] || 'Pune';
}

export function getWorker(id) {
  return WORKERS.find((w) => w.id === id) || WORKERS[0];
}

// True only for workers who exist in the demo catalogue (w1…w5): these are the
// "known" faces with a real rating/stats. A worker who registered with email is a
// brand-new member — rating 0, no history — and is NOT in the catalogue.
export function isKnownWorker(id) {
  return !!WORKERS.find((w) => w.id === id);
}

export function workersByService(service) {
  if (!service) return WORKERS;
  return WORKERS.filter((w) => w.service === service);
}

export function workerAvatar(worker) {
  return worker.avatar;
}
