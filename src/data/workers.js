// Mock cooperative worker profiles — Pune area
// location: [latitude, longitude]

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
  W('w1', 'Rajesh Kumar', '👨‍🔧', 'electrician', 4.9, 132, 410, 250, 1.2, true, 12, 2016, [18.5223, 73.8504], ['Hindi', 'Marathi'], 'Certified electrician with 12 years of experience in residential and commercial wiring, safety-focused and punctual.', ['Wiring', 'Inverter installation', 'Appliance repair'], ['ITI Electrical', 'BIS License'], '₹5,00,000 life + accident'),
  W('w2', 'Sunita Devi', '👩‍🔧', 'cleaner', 4.8, 96, 320, 200, 2.1, true, 8, 2018, [18.511, 73.8754], ['Hindi', 'Marathi', 'Telugu'], 'Trusted deep-cleaning expert known for thorough, chemical-safe home cleaning services.', ['Deep cleaning', 'Kitchen cleaning', 'Bathroom cleaning'], ['Cleaning Safety Certified'], '₹3,00,000 life cover'),
  W('w3', 'Mohammed Irfan', '👨‍🔧', 'plumber', 4.7, 204, 560, 300, 0.9, true, 15, 2014, [18.5288, 73.8975], ['Hindi', 'Urdu', 'Marathi'], 'Master plumber handling complex pipeline fittings, water tanks and drainage with precision.', ['Pipeline fitting', 'Water tank', 'Drainage'], ['ITI Plumbing', 'NSDC Certified'], '₹5,00,000 life + accident'),
  W('w4', 'Lakshmi Narayan', '👨‍🔧', 'carpenter', 4.8, 88, 245, 350, 3.4, false, 18, 2013, [18.4856, 73.8812], ['Marathi', 'Tamil', 'Hindi'], 'Skilled carpenter specialising in custom furniture, doors and modular fittings.', ['Furniture repair', 'Cabinet making', 'Door & window'], ['ITI Carpentry'], '₹4,00,000 life cover'),
  W('w5', 'Priya Sharma', '👩‍🍳', 'domestic', 4.9, 150, 480, 200, 1.8, true, 10, 2017, [18.5034, 73.8236], ['Hindi', 'English', 'Marathi'], 'Reliable domestic help for cooking and household assistance, with excellent hygiene habits.', ['Cooking', 'Cleaning help', 'Elderly companion'], ['Food Safety Certified'], '₹3,00,000 life cover'),
  W('w6', 'Anand Patil', '👨‍🔧', 'technician', 4.6, 74, 210, 350, 5.2, true, 11, 2015, [18.5704, 73.9017], ['Marathi', 'Hindi'], 'AC and appliance repair specialist covering split ACs, refrigerators and washing machines.', ['AC service', 'Refrigerator', 'Washing machine'], ['AC Technician Certified', 'Refrigerant Handling'], '₹5,00,000 life + accident'),
  W('w7', 'Ramesh Gowda', '👨‍🎨', 'painter', 4.7, 121, 380, 400, 4.5, false, 20, 2012, [18.4584, 73.8427], ['Marathi', 'Hindi'], 'Experienced painter delivering flawless wall painting, texture and waterproofing finishes.', ['Wall painting', 'Texture work', 'Waterproofing'], ['Industrial Painter Certificate'], '₹4,00,000 life cover'),
  W('w8', 'Meena Kumari', '👩‍⚕️', 'caregiver', 5.0, 64, 170, 450, 6.3, true, 9, 2018, [18.4754, 73.9367], ['Hindi', 'Marathi', 'English'], 'Compassionate caregiver with nursing training, experienced in elderly and post-surgery care.', ['Elderly care', 'Patient care', 'Post-surgery care'], ['Certified Caregiver', 'First Aid & CPR'], '₹5,00,000 life + accident'),
  W('w9', 'Vikram Singh', '👨‍🔧', 'electrician', 4.8, 110, 300, 250, 2.8, true, 13, 2015, [18.5404, 73.8167], ['Hindi', 'Punjabi', 'English'], 'Electrical specialist focused on safety, audits and smart home wiring.', ['Wiring', 'Switch & socket', 'Smart home'], ['ITI Electrical', 'Electrician License'], '₹5,00,000 life + accident'),
  W('w10', 'Fatima Begum', '👩‍🌾', 'gardener', 4.7, 58, 150, 250, 3.1, true, 7, 2019, [18.4684, 73.8717], ['Hindi', 'Urdu', 'Marathi'], 'Passionate gardener offering lawn care, plant nursing and seasonal garden makeovers.', ['Lawn & garden', 'Plant care', 'Garden cleanup'], ['Horticulture Training'], '₹3,00,000 life cover'),
  W('w11', 'Suresh Yadav', '👨‍🔧', 'plumber', 4.6, 95, 270, 300, 7.8, true, 14, 2016, [18.5654, 73.7767], ['Hindi', 'Marathi'], 'Dependable plumber for emergency leak fixes and full bathroom renovation.', ['Tap & mixer repair', 'Toilet & bathroom', 'Pipeline fitting'], ['ITI Plumbing'], '₹4,00,000 life cover'),
  W('w12', 'Kavitha Rao', '👩‍🔧', 'cleaner', 4.9, 142, 410, 200, 2.4, true, 9, 2017, [18.5204, 73.8567], ['Marathi', 'Tamil', 'English'], 'Top-rated cleaning professional known for move-in/move-out and post-construction cleaning.', ['Deep cleaning', 'Sofa & carpet', 'Kitchen cleaning'], ['Cleaning Safety Certified', 'Eco Products Trained'], '₹3,00,000 life cover'),
  W('w13', 'Deepak Joshi', '👨‍🔧', 'technician', 4.5, 67, 195, 350, 8.5, false, 10, 2018, [18.4904, 73.9567], ['Hindi', 'English'], 'Electronics repair expert for TVs, audio systems and home appliances.', ['TV & electronics', 'Washing machine', 'AC service'], ['Electronics Repair Certificate'], '₹4,00,000 life cover'),
  W('w14', 'Santosh Kamble', '👨‍✈️', 'driver', 4.8, 180, 520, 300, 3.6, true, 16, 2014, [18.5354, 73.8267], ['Marathi', 'Hindi'], 'Safe, experienced professional driver for local and outstation trips, always on time.', ['Local driver', 'Outstation', 'Chauffeur'], ['Heavy Vehicle License', 'Defensive Driving'], '₹5,00,000 life + accident'),
  W('w15', 'Nirmala Devi', '👩‍🍳', 'domestic', 4.8, 89, 250, 200, 1.5, true, 11, 2016, [18.5124, 73.8517], ['Hindi', 'Bhojpuri'], 'Efficient domestic help with strong cooking skills across North Indian and continental cuisines.', ['Cooking', 'Cleaning help'], ['Food Safety Certified'], '₹3,00,000 life cover'),
  W('w16', 'Arun Kumar', '👨‍🔧', 'carpenter', 4.7, 76, 220, 350, 4.2, true, 12, 2017, [18.4584, 73.8967], ['Tamil', 'Marathi', 'Hindi'], 'Detail-oriented carpenter for repairs, fittings and custom woodwork.', ['Furniture repair', 'Fitting & fixtures'], ['ITI Carpentry'], '₹4,00,000 life cover'),
  W('w17', 'Pooja Patel', '👩‍⚕️', 'caregiver', 4.9, 71, 190, 450, 5.6, true, 8, 2019, [18.5054, 73.9067], ['Hindi', 'Gujarati', 'English'], 'Gentle and patient caregiver experienced with children and elderly residents.', ['Child care', 'Elderly care'], ['Certified Caregiver', 'CPR Trained'], '₹5,00,000 life + accident'),
  W('w18', 'Manoj Tiwari', '👨‍🎨', 'painter', 4.6, 102, 310, 400, 6.8, false, 15, 2015, [18.5304, 73.8967], ['Hindi', 'Marathi'], 'Skilled painter for residential interiors, exterior and decorative finishes.', ['Wall painting', 'Wood polish'], ['Painter Trade Certificate'], '₹4,00,000 life cover'),
  W('w19', 'Geetha Lakshmi', '👩‍🌾', 'gardener', 4.6, 43, 120, 250, 2.9, true, 6, 2020, [18.5104, 73.8367], ['Tamil', 'Marathi'], 'Eco-conscious gardener specialising in terrace gardens and indoor plants.', ['Plant care', 'Terrace garden'], ['Horticulture Training'], '₹3,00,000 life cover'),
  W('w20', 'Ravi Shankar', '👨‍✈️', 'driver', 4.7, 156, 440, 300, 4.9, true, 14, 2016, [18.4804, 73.8567], ['Marathi', 'Telugu', 'Hindi'], 'Reliable commercial and personal driver with excellent route knowledge of the city.', ['Commercial vehicle', 'Local driver'], ['Commercial License', 'Defensive Driving'], '₹5,00,000 life + accident'),
  W('w21', 'Asha Rani', '👩‍🔧', 'cleaner', 4.8, 78, 235, 200, 3.9, true, 7, 2019, [18.5504, 73.8767], ['Hindi', 'Marathi'], 'Friendly cleaning professional providing sparkling results every single time.', ['Deep cleaning', 'Bathroom cleaning'], ['Cleaning Safety Certified'], '₹3,00,000 life cover'),
  W('w22', 'Vijay Kumar', '👨‍🔧', 'electrician', 4.7, 85, 260, 250, 5.5, true, 9, 2018, [18.4704, 73.8067], ['Hindi', 'Marathi', 'English'], 'Young electrician skilled in modern home automation and energy-efficient lighting.', ['Wiring', 'Fan & light repair', 'Smart home'], ['ITI Electrical'], '₹4,00,000 life cover'),
  W('w23', 'Sakshi Gupta', '👩‍🔧', 'technician', 4.5, 51, 140, 350, 7.2, true, 7, 2020, [18.5604, 73.9167], ['Hindi', 'English'], 'Appliance technician focused on washing machines and refrigerators with warranty on work.', ['Washing machine', 'Refrigerator'], ['Appliance Repair Certified'], '₹4,00,000 life cover'),
  W('w24', 'Hari Prasad', '👨‍🔧', 'plumber', 4.8, 118, 340, 300, 3.0, true, 13, 2015, [18.5254, 73.8667], ['Telugu', 'Marathi', 'Hindi'], 'Experienced plumber offering full bathroom fittings and water pressure solutions.', ['Toilet & bathroom', 'Tap & mixer repair'], ['ITI Plumbing', 'NSDC Certified'], '₹4,00,000 life cover'),
];

export function getWorker(id) {
  return WORKERS.find((w) => w.id === id) || WORKERS[0];
}

export function workersByService(service) {
  if (!service) return WORKERS;
  return WORKERS.filter((w) => w.service === service);
}

export function workerAvatar(worker) {
  return worker.avatar;
}
