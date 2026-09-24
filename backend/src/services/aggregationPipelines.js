import {
  Booking,
  Listing,
  Availability,
  Request,
  Quote,
  Rating,
  SearchEvent,
  BusinessProfile,
} from "../models/index.js";

const cityPattern = (value) => ({
  $regex:
    "^" +
    String(value)
      .slice(0, 100)
      .replace(/[.*+?^{}$()|[\]\\]/g, "\\$&") +
    "$",
  $options: "i",
});

export async function demandHeatmap(filters = {}) {
  const match = {};
  if (filters.city) match.city = cityPattern(filters.city);
  if (filters.category) match["items.category"] = filters.category;

  const pipeline = [
    {
      $match: {
        status: { $in: ["open", "partial"] },
        end: { $gt: new Date() },
        ...match,
      },
    },
    { $unwind: "$items" },
    {
      $match: {
        "items.booking": { $exists: false },
        ...(filters.category ? { "items.category": filters.category } : {}),
      },
    },
    {
      $group: {
        _id: { category: "$items.category", city: "$city" },
        requestIds: { $addToSet: "$_id" },
        totalUnits: { $sum: "$items.quantity" },
        avgBudget: { $avg: "$budget" },
        urgentCount: {
          $sum: { $cond: [{ $ne: ["$urgency", "routine"] }, 1, 0] },
        },
      },
    },
    { $set: { requestCount: { $size: "$requestIds" } } },
    {
      $project: {
        category: "$_id.category",
        city: "$_id.city",
        requestCount: 1,
        totalUnits: 1,
        avgBudget: { $round: ["$avgBudget", 0] },
        urgentCount: 1,
        // A display index, not a probability or a forecast.
        intensity: {
          $round: [
            {
              $add: [
                { $multiply: ["$requestCount", 2] },
                "$totalUnits",
                { $multiply: ["$urgentCount", 3] },
              ],
            },
            0,
          ],
        },
        _id: 0,
      },
    },
    { $sort: { intensity: -1 } },
    { $limit: 50 },
  ];
  return Request.aggregate(pipeline);
}

export async function supplyUtilization(userId, filters = {}) {
  const match = { status: "active" };
  if (userId) match.owner = userId;
  if (filters.category) match.category = filters.category;
  if (filters.city) match.city = cityPattern(filters.city);

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 86400000);

  const listings = await Listing.find(match)
    .select("title category quantity city")
    .lean();
  const ids = listings.map((l) => l._id);

  const bookingBlocks = await Availability.aggregate([
    {
      $match: {
        listing: { $in: ids },
        start: { $lt: now },
        end: { $gt: thirtyDaysAgo },
        booking: { $exists: true },
      },
    },
    {
      $group: {
        _id: "$listing",
        blockedDays: {
          $sum: {
            $multiply: [
              "$quantity",
              {
                $divide: [
                  {
                    $subtract: [
                      { $min: ["$end", now] },
                      { $max: ["$start", thirtyDaysAgo] },
                    ],
                  },
                  86400000,
                ],
              },
            ],
          },
        },
        bookingCount: { $sum: 1 },
      },
    },
  ]);

  return listings.map((l) => {
    const block = bookingBlocks.find(
      (b) => String(b._id) === String(l._id),
    ) || { blockedDays: 0, bookingCount: 0 };
    const maxDays = l.quantity * 30;
    return {
      listingId: l._id,
      title: l.title,
      category: l.category,
      city: l.city,
      totalCapacityDays: maxDays,
      bookedDays: Math.round(block.blockedDays),
      utilizationPercent: maxDays
        ? Math.round((block.blockedDays / maxDays) * 100)
        : 0,
      bookingCount: block.bookingCount,
    };
  });
}

export async function liquidityRatios(filters = {}) {
  const match = {};
  if (filters.city) match.city = cityPattern(filters.city);

  const [searches, requests, bookings] = await Promise.all([
    SearchEvent.aggregate([
      {
        $match: {
          ...match,
          ...(filters.category ? { category: filters.category } : {}),
        },
      },
      {
        $group: {
          _id: { category: "$category", city: "$city" },
          searches: { $sum: 1 },
        },
      },
    ]),
    Request.aggregate([
      { $match: { ...match, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $match: filters.category ? { "items.category": filters.category } : {},
      },
      {
        $group: {
          _id: { category: "$items.category", city: "$city" },
          requests: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: { status: { $in: ["confirmed", "completed", "in_progress"] } },
      },
      {
        $lookup: {
          from: "requests",
          localField: "request",
          foreignField: "_id",
          as: "requestDoc",
        },
      },
      { $unwind: "$requestDoc" },
      {
        $set: {
          requestedItem: { $arrayElemAt: ["$requestDoc.items", "$itemIndex"] },
        },
      },
      {
        $match: {
          ...(filters.city
            ? { "requestDoc.city": cityPattern(filters.city) }
            : {}),
          ...(filters.category
            ? { "requestedItem.category": filters.category }
            : {}),
        },
      },
      {
        $group: {
          _id: {
            category: "$requestedItem.category",
            city: "$requestDoc.city",
          },
          bookings: { $sum: 1 },
          value: { $sum: "$price" },
        },
      },
    ]),
  ]);

  const combined = {};
  for (const s of searches) {
    const key = `${s._id.category}:${s._id.city}`;
    combined[key] = { ...combined[key], ...s._id, searches: s.searches };
  }
  for (const r of requests) {
    const key = `${r._id.category}:${r._id.city}`;
    combined[key] = { ...combined[key], ...r._id, requests: r.requests };
  }
  for (const b of bookings) {
    const key = `${b._id.category}:${b._id.city}`;
    combined[key] = {
      ...combined[key],
      ...b._id,
      bookings: b.bookings,
      value: b.value,
    };
  }

  return Object.values(combined)
    .map((c) => ({
      category: c.category || "unknown",
      city: c.city || "unknown",
      searches: c.searches || 0,
      requests: c.requests || 0,
      bookings: c.bookings || 0,
      value: c.value || 0,
      liquidityRatio:
        c.searches > 0
          ? Math.round(((c.bookings || 0) / c.searches) * 100)
          : null,
      conversionRate:
        c.requests > 0
          ? Math.round(((c.bookings || 0) / c.requests) * 100)
          : null,
    }))
    .sort((a, b) => b.searches - a.searches);
}

export async function revenueTrend(userId, mode = "provider", period = 12) {
  const match = userId
    ? { [mode === "seeker" ? "seeker" : "provider"]: userId }
    : {};
  const since = new Date();
  since.setMonth(since.getMonth() - period);

  return Booking.aggregate([
    {
      $match: {
        ...match,
        status: { $ne: "cancelled" },
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        },
        bookings: { $sum: 1 },
        revenue: { $sum: "$price" },
        commission: { $sum: "$commission" },
        avgPrice: { $avg: "$price" },
      },
    },
    {
      $project: {
        period: "$_id.month",
        bookings: 1,
        revenue: { $round: ["$revenue", 0] },
        commission: { $round: ["$commission", 0] },
        avgPrice: { $round: ["$avgPrice", 0] },
        _id: 0,
      },
    },
    { $sort: { period: 1 } },
  ]);
}

export async function providerPerformance(userId) {
  const match = userId ? { provider: userId } : {};

  const [responseTime, acceptanceRate, ratings, bookingStats] =
    await Promise.all([
      Quote.aggregate([
        { $match: { ...match, status: { $ne: "invited" } } },
        {
          $set: {
            offers: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$offers",
                    as: "offer",
                    cond: { $eq: ["$$offer.by", "$provider"] },
                  },
                },
                0,
              ],
            },
          },
        },
        { $match: { "offers.at": { $exists: true } } },
        {
          $group: {
            _id: "$provider",
            firstOfferCount: { $sum: 1 },
            avgResponseMs: {
              $avg: { $subtract: ["$offers.at", "$createdAt"] },
            },
          },
        },
      ]),
      Quote.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$provider",
            total: { $sum: 1 },
            accepted: {
              $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
            },
            declined: {
              $sum: { $cond: [{ $eq: ["$status", "declined"] }, 1, 0] },
            },
          },
        },
      ]),
      Rating.aggregate([
        {
          $match: userId ? { to: userId } : { to: { $exists: true } },
        },
        {
          $lookup: {
            from: "bookings",
            localField: "booking",
            foreignField: "_id",
            as: "bookingDoc",
          },
        },
        { $unwind: "$bookingDoc" },
        { $match: { $expr: { $eq: ["$to", "$bookingDoc.provider"] } } },
        {
          $group: {
            _id: "$to",
            avgRating: { $avg: "$score" },
            ratingCount: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        { $match: { ...match, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$provider",
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: "$price" },
            completedBookings: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

  const providers = new Set([
    ...responseTime.map((r) => String(r._id)),
    ...acceptanceRate.map((r) => String(r._id)),
    ...ratings.map((r) => String(r._id)),
    ...bookingStats.map((r) => String(r._id)),
  ]);

  const result = [];
  for (const pid of providers) {
    const rt = responseTime.find((r) => String(r._id) === pid);
    const ar = acceptanceRate.find((r) => String(r._id) === pid);
    const ra = ratings.find((r) => String(r._id) === pid);
    const bs = bookingStats.find((r) => String(r._id) === pid);

    result.push({
      providerId: pid,
      avgResponseHours: rt ? Math.round(rt.avgResponseMs / 3600000) : null,
      acceptanceRate:
        ar && ar.total > 0 ? Math.round((ar.accepted / ar.total) * 100) : null,
      totalQuotes: ar?.total || 0,
      avgRating: ra ? Math.round(ra.avgRating * 10) / 10 : null,
      ratingCount: ra?.ratingCount || 0,
      totalBookings: bs?.totalBookings || 0,
      totalRevenue: bs?.totalRevenue || 0,
      completionRate:
        bs && bs.totalBookings > 0
          ? Math.round((bs.completedBookings / bs.totalBookings) * 100)
          : null,
    });
  }
  return result;
}

export async function geoClusters(filters = {}) {
  const match = { status: "active" };
  if (filters.category) match.category = filters.category;
  if (filters.city) match.city = cityPattern(filters.city);

  return Listing.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$city",
        listingCount: { $sum: 1 },
        categories: { $addToSet: "$category" },
        longitude: { $avg: { $arrayElemAt: ["$location.coordinates", 0] } },
        latitude: { $avg: { $arrayElemAt: ["$location.coordinates", 1] } },
      },
    },
    {
      $project: {
        city: "$_id",
        listingCount: 1,
        categoryCount: { $size: "$categories" },
        categories: 1,
        coordinates: ["$longitude", "$latitude"],
        _id: 0,
      },
    },
    { $sort: { listingCount: -1 } },
    { $limit: 30 },
  ]);
}

export async function marketPulse() {
  const oneDayAgo = new Date(Date.now() - 86400000);
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000);

  const [
    recentSearches,
    recentRequests,
    recentBookings,
    trendingCategories,
    priceMovement,
    activeBusinesses,
  ] = await Promise.all([
    SearchEvent.countDocuments({ createdAt: { $gte: oneDayAgo } }),
    Request.countDocuments({ createdAt: { $gte: oneDayAgo } }),
    Booking.countDocuments({ createdAt: { $gte: oneDayAgo } }),
    SearchEvent.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo } } },
      {
        $group: {
          _id: "$category",
          searchVelocity: { $sum: 1 },
          cities: { $addToSet: "$city" },
        },
      },
      { $sort: { searchVelocity: -1 } },
      { $limit: 10 },
      {
        $project: {
          category: "$_id",
          searchVelocity: 1,
          hotCities: { $slice: ["$cities", 5] },
          _id: 0,
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo },
          status: { $ne: "cancelled" },
        },
      },
      {
        $lookup: {
          from: "listings",
          localField: "listing",
          foreignField: "_id",
          as: "listingDoc",
        },
      },
      { $unwind: "$listingDoc" },
      {
        $group: {
          _id: "$listingDoc.category",
          avgPrice: { $avg: "$price" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: "$_id",
          avgPrice: { $round: ["$avgPrice", 0] },
          bookingCount: "$count",
          _id: 0,
        },
      },
      { $sort: { bookingCount: -1 } },
    ]),
    BusinessProfile.countDocuments({
      role: "business",
      updatedAt: { $gte: oneDayAgo },
    }),
  ]);

  return {
    snapshot: {
      searchesToday: recentSearches,
      requestsToday: recentRequests,
      bookingsToday: recentBookings,
      activeBusinesses,
      timestamp: new Date(),
    },
    trendingCategories,
    priceMovement,
  };
}

export async function bundleCoverage(userId) {
  return Request.aggregate([
    {
      $match: {
        status: { $ne: "cancelled" },
        ...(userId ? { seeker: userId } : {}),
      },
    },
    {
      $project: {
        title: 1,
        city: 1,
        totalItems: { $size: "$items" },
        fulfilledItems: {
          $size: {
            $filter: {
              input: "$items",
              as: "item",
              cond: { $ifNull: ["$$item.booking", false] },
            },
          },
        },
        status: 1,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgCoverage: {
          $avg: {
            $cond: [
              { $gt: ["$totalItems", 0] },
              {
                $multiply: [
                  { $divide: ["$fulfilledItems", "$totalItems"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        status: "$_id",
        count: 1,
        avgCoveragePercent: { $round: ["$avgCoverage", 0] },
        _id: 0,
      },
    },
  ]);
}
