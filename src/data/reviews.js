// Additional sample reviews shown on worker profiles
export const REVIEWS = {
  w1: [
    { name: 'Anita D.', rating: 5, text: 'Fixed our wiring safely and cleanly. Highly recommended.', date: '2 Sep 2026' },
    { name: 'Kiran M.', rating: 5, text: 'Punctual and knowledgeable. Installed our inverter quickly.', date: '28 Aug 2026' },
    { name: 'Sanjay P.', rating: 4, text: 'Good work, arrived exactly on time.', date: '20 Aug 2026' },
  ],
  w2: [
    { name: 'Rohit V.', rating: 5, text: 'Stopped the leak in minutes. Very skilled plumber.', date: '4 Sep 2026' },
    { name: 'Sneha K.', rating: 4, text: 'Fixed the bathroom fitting well. Reasonable price.', date: '15 Aug 2026' },
  ],
  w3: [
    { name: 'Meena R.', rating: 5, text: 'Cared for my mother with such patience. Truly compassionate.', date: '3 Sep 2026' },
    { name: 'Farah K.', rating: 5, text: 'Very gentle and professional during recovery care.', date: '19 Aug 2026' },
  ],
  w4: [
    { name: 'Nikhil B.', rating: 5, text: 'Our AC cooled perfectly after the service. Great work.', date: '1 Sep 2026' },
    { name: 'Anushka P.', rating: 4, text: 'Fixed the fridge quickly and explained the problem clearly.', date: '10 Aug 2026' },
  ],
  w5: [
    { name: 'Anita D.', rating: 5, text: 'The house sparkled after the deep cleaning. Thank you!', date: '5 Sep 2026' },
    { name: 'Naveen R.', rating: 5, text: 'Very thorough and used safe products.', date: '22 Aug 2026' },
  ],
};

export function reviewsForWorker(workerId) {
  return REVIEWS[workerId] || [];
}