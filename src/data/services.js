// Service categories offered by the cooperative
// icon names map to @expo/vector-icons (MaterialCommunityIcons)
export const SERVICES = [
  { id: 'electrician', icon: 'flash', price: 250, color: '#F5A623' },
  { id: 'plumber', icon: 'pipe-wrench', price: 300, color: '#2E7BB0' },
  { id: 'carpenter', icon: 'saw-blade', price: 350, color: '#8B5CF6' },
  { id: 'painter', icon: 'format-paint', price: 400, color: '#D9534F' },
  { id: 'cleaner', icon: 'broom', price: 200, color: '#1E9E5A' },
  { id: 'caregiver', icon: 'human-handsup', price: 450, color: '#E0679B' },
  { id: 'driver', icon: 'car', price: 300, color: '#16A085' },
  { id: 'gardener', icon: 'flower', price: 250, color: '#7CB342' },
  { id: 'technician', icon: 'wrench', price: 350, color: '#34495E' },
  { id: 'domestic', icon: 'home-heart', price: 200, color: '#C0392B' },
];

export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

export function getService(id) {
  // Emergency is NOT a browsable customer category (never in SERVICES above) —
  // it exists only as a booking.service for SOS-accepted jobs.
  if (id === 'emergency') {
    return { id: 'emergency', icon: 'alarm-light', price: 500, color: '#D9534F' };
  }
  return SERVICE_BY_ID[id] || SERVICES[0];
}

// Common sub-services / skills per category
export const SKILLS_BY_SERVICE = {
  electrician: ['Wiring', 'Switch & socket', 'Fan & light repair', 'Inverter installation', 'Appliance repair'],
  plumber: ['Tap & mixer repair', 'Pipeline fitting', 'Water tank', 'Drainage', 'Toilet & bathroom'],
  carpenter: ['Furniture repair', 'Door & window', 'Cabinet making', 'Fitting & fixtures'],
  painter: ['Wall painting', 'Texture work', 'Waterproofing', 'Wood polish'],
  cleaner: ['Deep cleaning', 'Bathroom cleaning', 'Kitchen cleaning', 'Sofa & carpet'],
  caregiver: ['Elderly care', 'Patient care', 'Child care', 'Post-surgery care'],
  driver: ['Local driver', 'Outstation', 'Commercial vehicle', 'Chauffeur'],
  gardener: ['Lawn & garden', 'Plant care', 'Tree trimming', 'Garden cleanup'],
  technician: ['AC service', 'Refrigerator', 'Washing machine', 'TV & electronics'],
  domestic: ['Cooking', 'Cleaning help', 'Full-time help', 'Elderly companion'],
};
