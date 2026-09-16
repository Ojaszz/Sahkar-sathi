// Pune area ↔ pincode dataset used by the area/pincode selector everywhere in
// the app (booking address, profile location, register). Approx coords for the
// tracking map are included so a picked area can seed a map position.
// lat/lng values are approximate neighbourhood centres — enough for the demo.

export const PUNE_AREAS = [
  { area: 'FC Road',        pincode: '411005', lat: 18.5223, lng: 73.8504 },
  { area: 'Shivajinagar',   pincode: '411005', lat: 18.5308, lng: 73.8475 },
  { area: 'Deccan Gymkhana',pincode: '411004', lat: 18.5176, lng: 73.8413 },
  { area: 'Erandwane',      pincode: '411004', lat: 18.5068, lng: 73.8404 },
  { area: 'Kothrud',        pincode: '411038', lat: 18.5074, lng: 73.8077 },
  { area: 'Karve Nagar',    pincode: '411052', lat: 18.4911, lng: 73.8136 },
  { area: 'Aundh',          pincode: '411007', lat: 18.5591, lng: 73.8076 },
  { area: 'Baner',          pincode: '411045', lat: 18.5590, lng: 73.7863 },
  { area: 'Wakad',          pincode: '411057', lat: 18.5966, lng: 73.7628 },
  { area: 'Hinjewadi',      pincode: '411057', lat: 18.5913, lng: 73.7389 },
  { area: 'Pimple Saudagar',pincode: '411027', lat: 18.5928, lng: 73.7857 },
  { area: 'Viman Nagar',    pincode: '411014', lat: 18.5679, lng: 73.9143 },
  { area: 'Kharadi',        pincode: '411014', lat: 18.5520, lng: 73.9372 },
  { area: 'Hadapsar',       pincode: '411028', lat: 18.5092, lng: 73.9251 },
  { area: 'Magarpatta',     pincode: '411028', lat: 18.5155, lng: 73.9347 },
  { area: 'Koregaon Park',  pincode: '411001', lat: 18.5362, lng: 73.8940 },
  { area: 'Camp (Pune Camp)', pincode: '411001', lat: 18.5143, lng: 73.8770 },
  { area: 'Sahakar Nagar',  pincode: '411009', lat: 18.5020, lng: 73.8560 },
  { area: 'Bibwewadi',      pincode: '411037', lat: 18.4662, lng: 73.8612 },
  { area: 'Swargate',       pincode: '411042', lat: 18.5018, lng: 73.8534 },
];

export function areaByPincode(pincode) {
  return PUNE_AREAS.find((a) => a.pincode === pincode) || null;
}

export function areaByKey(area) {
  return PUNE_AREAS.find((a) => a.area === area) || null;
}

export function randomArea() {
  return PUNE_AREAS[Math.floor(Math.random() * PUNE_AREAS.length)];
}