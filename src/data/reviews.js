// Additional sample reviews shown on worker profiles
export const REVIEWS = {
  w1: [
    { name: 'Anita D.', rating: 5, text: 'Fixed our wiring safely and cleanly. Highly recommended.', date: '2 Sep 2026' },
    { name: 'Kiran M.', rating: 5, text: 'Punctual and knowledgeable. Installed our inverter quickly.', date: '28 Aug 2026' },
    { name: 'Sanjay P.', rating: 4, text: 'Good work, arrived exactly on time.', date: '20 Aug 2026' },
  ],
  w3: [
    { name: 'Rohit V.', rating: 5, text: 'Stopped the leak in minutes. Very skilled plumber.', date: '4 Sep 2026' },
    { name: 'Sneha K.', rating: 4, text: 'Fixed the bathroom fitting well. Reasonable price.', date: '15 Aug 2026' },
  ],
  w12: [
    { name: 'Anita D.', rating: 5, text: 'The house sparkled after the deep cleaning. Thank you!', date: '5 Sep 2026' },
    { name: 'Naveen R.', rating: 5, text: 'Very thorough and used safe products.', date: '22 Aug 2026' },
  ],
};

export function reviewsForWorker(workerId) {
  return REVIEWS[workerId] || [];
}