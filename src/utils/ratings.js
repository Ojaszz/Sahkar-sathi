// Rating maths for REGISTERED workers (uuid ids, not in the demo catalogue).
//
// A registered worker's rating is dynamic: it averages
//   (a) ratings they earned directly as the assigned worker on completed jobs, and
//   (b) RATINGS SHARED via the tag-along loop — when a mentor takes a junior along,
//       the customer's rating on the mentor's completed job is mirrored to the junior
//       (rows in the `tag_alongs` board where junior_id === workerId and rating set).
// Demo/catalogue workers (w1…w5) keep their static catalogue rating instead.
export function ratingSnapshot(workerId, ownBookings, sharedRatings) {
  const direct = (ownBookings || [])
    .filter((b) => b.workerId === workerId && b.reviewed && b.rating != null)
    .map((b) => Number(b.rating));
  // Accept both the server row shape (junior_id) and the store's local shape
  // (juniorId) so callers can pass either raw tag_alongs rows or store rows.
  const myId = (r) => r.junior_id || r.juniorId;
  const shared = (sharedRatings || [])
    .filter((r) => myId(r) === workerId && r.rating != null)
    .map((r) => Number(r.rating));
  const all = [...direct, ...shared];
  if (!all.length) return { avg: 0, count: 0 };
  return {
    avg: Math.round((all.reduce((s, r) => s + r, 0) / all.length) * 10) / 10,
    count: all.length,
  };
}