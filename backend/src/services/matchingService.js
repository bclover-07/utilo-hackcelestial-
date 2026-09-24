import { Listing, Availability, Rating, SearchEvent } from "../models/index.js";
import { searchSchema } from "./validation.js";
export function overlaps(a, b) {
  return (
    new Date(a.start) < new Date(b.end) && new Date(a.end) > new Date(b.start)
  );
}

export function peakReserved(blocks, start, end) {
  const events = blocks
    .filter((b) => overlaps(b, { start, end }))
    .flatMap((b) => [
      [Math.max(+new Date(b.start), +new Date(start)), b.quantity],
      [Math.min(+new Date(b.end), +new Date(end)), -b.quantity],
    ]);
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let used = 0,
    peak = 0;
  for (const [, delta] of events) {
    used += delta;
    peak = Math.max(peak, used);
  }
  return peak;
}
export function estimate(listing, filters) {
  const hours =
    filters.start && filters.end
      ? (new Date(filters.end) - new Date(filters.start)) / 3600000
      : listing.minHours;
  const units =
    listing.unit === "hour"
      ? Math.ceil(hours)
      : listing.unit === "day"
        ? Math.ceil(hours / 24)
        : 1;
  return (
    listing.price * units * (filters.quantity || 1) +
    (filters.delivery ? listing.deliveryFee : 0)
  );
}
export function rank(listing, filters, rating) {
  const total = estimate(listing, filters);
  const distance =
    listing.distanceMeters == null ? null : listing.distanceMeters / 1000;
  const priceFit = filters.budget ? Math.min(1, filters.budget / total) : 1;
  const distanceFit =
    distance === null ? null : Math.max(0, 1 - distance / filters.radiusKm);
  const factors = [{ weight: 0.55, value: priceFit }];
  if (distanceFit !== null) factors.push({ weight: 0.3, value: distanceFit });
  if (rating) factors.push({ weight: 0.15, value: rating.average / 5 });
  const score = Math.round(
    (100 * factors.reduce((s, f) => s + f.weight * f.value, 0)) /
      factors.reduce((s, f) => s + f.weight, 0),
  );
  return {
    ...listing,
    estimatedTotal: total,
    distanceKm: distance,
    rating: rating?.average ?? null,
    ratingCount: rating?.count ?? 0,
    score,
    reasons: [
      distance === null
        ? "Distance not requested"
        : `${distance.toFixed(1)} km away`,
      filters.budget
        ? total <= filters.budget
          ? "Within your budget"
          : "Above your budget"
        : "No budget constraint",
      rating
        ? `${rating.average.toFixed(1)}/5 from ${rating.count} reviews`
        : "No reviews yet",
      filters.start
        ? "Quantity available for these dates"
        : "Select dates to check availability",
    ],
  };
}
export async function search(raw, user, { log = false, session, all = false } = {}) {
  const f = searchSchema.parse(raw);
  const query = { status: "active", moderationHold: { $ne: true } };
  if (user) query.owner = { $ne: user._id };
  if (f.category) query.category = f.category;
  if (f.city)
    query.city = {
      $regex: `^${f.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    };
  query.quantity = { $gte: f.quantity };
  query.capacity = { $gte: f.capacity };
  if (f.delivery) query.delivery = true;
  if (f.query)
    query.title = {
      $regex: f.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  const pipeline = f.coordinates
    ? [
        {
          $geoNear: {
            near: { type: "Point", coordinates: f.coordinates },
            key: "location",
            distanceField: "distanceMeters",
            maxDistance: f.radiusKm * 1000,
            spherical: true,
            query,
          },
        },
      ]
    : [{ $match: query }, { $sort: { createdAt: -1 } }];
  const candidates = await Listing.aggregate([
    ...pipeline,
    { $limit: 200 },
    { $project: { embedding: 0 } },
  ]).session(session || null);
  const ids = candidates.map((l) => l._id);
  const blocks = f.start
    ? await Availability.find({
        listing: { $in: ids },
        start: { $lt: f.end },
        end: { $gt: f.start },
      })
        .session(session || null)
        .lean()
    : [];
  const ratings = await Rating.aggregate([
    { $match: { to: { $in: candidates.map((l) => l.owner) } } },
    { $group: { _id: "$to", average: { $avg: "$score" }, count: { $sum: 1 } } },
  ]).session(session || null);
  const results = candidates
    .filter(
      (l) =>
        !f.start ||
        ((f.end - f.start) / 3600000 >= l.minHours &&
          l.quantity -
            peakReserved(
              blocks.filter((b) => String(b.listing) === String(l._id)),
              f.start,
              f.end,
            ) >=
            f.quantity),
    )
    .map((l) =>
      rank(
        { ...l, availableQuantity: l.quantity - (f.start ? peakReserved(blocks.filter(b => String(b.listing) === String(l._id)), f.start, f.end) : 0) },
        f,
        ratings.find((r) => String(r._id) === String(l.owner)),
      ),
    )
    .sort((a, b) => b.score - a.score);
  if (log && user)
    await SearchEvent.create({
      user: user._id,
      category: f.category,
      city: f.city,
      resultCount: results.length,
    });
  return {
    items: all ? results : results.slice((f.page - 1) * 24, f.page * 24),
    total: results.length,
    page: f.page,
    candidateLimit: 200,
  };
}
