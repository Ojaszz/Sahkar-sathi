// Formatting helpers

export function formatINR(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dnum = d.getDate();
  const suff = dnum % 10 === 1 && dnum !== 11 ? 'st' : dnum % 10 === 2 && dnum !== 12 ? 'nd' : dnum % 10 === 3 && dnum !== 13 ? 'rd' : 'th';
  return `${dnum}${suff} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function id(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// Distance between two [lat,lng] in km (haversine)
export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(h))).toFixed(1);
}