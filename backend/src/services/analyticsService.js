import {
  Booking,
  Listing,
  Request,
  Quote,
  BusinessProfile,
  SearchEvent,
  Insight,
} from "../models/index.js";
export async function analytics(user, mode = "provider") {
  const admin = user.role === "admin";
  const match = admin
    ? {}
    : { [mode === "seeker" ? "seeker" : "provider"]: user._id };
  const [
    listings,
    requests,
    quotes,
    bookings,
    businesses,
    trend,
    categories,
    demand,
    supply,
    insights,
  ] = await Promise.all([
    Listing.countDocuments(
      admin ? {} : { owner: user._id, status: { $ne: "archived" } },
    ),
    Request.countDocuments(admin ? {} : { seeker: user._id }),
    Quote.countDocuments({ ...match, status: { $in: ["invited", "offered"] } }),
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          value: { $sum: "$price" },
        },
      },
    ]),
    admin
      ? BusinessProfile.countDocuments({ role: "business" })
      : Promise.resolve(undefined),
    Booking.aggregate([
      { $match: { ...match, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          bookings: { $sum: 1 },
          value: { $sum: "$price" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Listing.aggregate([
      {
        $match: admin
          ? { status: "active" }
          : { owner: user._id, status: "active" },
      },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Request.aggregate([
      {
        $match: {
          status: { $in: ["open", "partial"] },
          ...(!admin && user.city ? { city: user.city } : {}),
        },
      },
      { $unwind: "$items" },
      { $match: { "items.booking": { $exists: false } } },
      {
        $group: {
          _id: "$items.category",
          requests: { $sum: 1 },
          units: { $sum: "$items.quantity" },
        },
      },
    ]),
    Listing.aggregate([
      {
        $match: {
          status: "active",
          ...(!admin && user.city ? { city: user.city } : {}),
        },
      },
      { $group: { _id: "$category", units: { $sum: "$quantity" } } },
    ]),
    Insight.find({ owner: user._id }).sort({ generatedAt: -1 }).limit(1).lean(),
  ]);
  const confirmed = await Request.countDocuments({
    ...(admin ? {} : { seeker: user._id }),
    status: "confirmed",
  });
  const searches = await SearchEvent.countDocuments(
    admin ? {} : { user: user._id },
  );
  return {
    listings,
    requests,
    quotes,
    businesses,
    bookings,
    trend,
    categories,
    insights,
    searches,
    fulfillmentRate: requests ? Math.round((confirmed / requests) * 100) : null,
    totalValue: bookings
      .filter((b) => b._id !== "cancelled")
      .reduce((s, b) => s + b.value, 0),
    demand: demand.map((d) => ({
      ...d,
      listedUnits: supply.find((s) => s._id === d._id)?.units || 0,
    })),
    scope: admin ? "Platform" : `${mode} account`,
    city: user.city,
  };
}
export async function csv(user, mode) {
  const rows = await Booking.find(
    user.role === "admin"
      ? {}
      : { [mode === "seeker" ? "seeker" : "provider"]: user._id },
  )
    .populate("listing", "title")
    .lean();
  const safe = (value) =>
    '"' +
    String(value ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  return [
    [
      "Booking ID",
      "Resource",
      "Start UTC",
      "End UTC",
      "Status",
      "Agreed INR",
      "Commission INR",
    ],
    ...rows.map((b) => [
      b._id,
      b.listing?.title,
      b.start.toISOString(),
      b.end.toISOString(),
      b.status,
      b.price,
      b.commission,
    ]),
  ]
    .map((r) => r.map(safe).join(","))
    .join("\r\n");
}
