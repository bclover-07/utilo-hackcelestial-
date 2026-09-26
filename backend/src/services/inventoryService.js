import mongoose from "mongoose";
import { Listing, Booking, Notification } from "../models/index.js";
import { notify } from "./notificationService.js";
import { emitToUser } from "../socket.js";
import { assert } from "../middlewares/errors.js";

export async function getInventoryDashboard(user) {
  const userId = user._id;
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3600000);

  const listings = await Listing.aggregate([
    { $match: { owner: userId, status: { $ne: "archived" } } },
    {
      $lookup: {
        from: "bookings",
        let: { listingId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$listing", "$$listingId"] },
              status: { $in: ["confirmed", "in_progress"] },
            },
          },
          {
            $lookup: {
              from: "businessprofiles",
              localField: "seeker",
              foreignField: "_id",
              as: "seekerInfo",
              pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }],
            },
          },
          {
            $unwind: {
              path: "$seekerInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $sort: { end: 1 } },
          {
            $project: {
              _id: 1,
              seeker: "$seekerInfo",
              isOfflineDeal: 1,
              offlineClient: 1,
              start: 1,
              end: 1,
              quantity: 1,
              price: 1,
              deposit: 1,
              status: 1,
              conditions: 1,
              createdAt: 1,
            },
          },
        ],
        as: "activeBookings",
      },
    },
    {
      $addFields: {
        unitsOnRent: { $sum: "$activeBookings.quantity" },
        unitsAvailable: {
          $max: [
            0,
            { $subtract: ["$quantity", { $sum: "$activeBookings.quantity" }] },
          ],
        },
        nextExpiry: { $arrayElemAt: ["$activeBookings.end", 0] },
        revenueFromActive: { $sum: "$activeBookings.price" },
        hasOverdueRental: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: "$activeBookings",
                  as: "b",
                  cond: { $lt: ["$$b.end", now] },
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        embedding: 0,
        embeddingModel: 0,
      },
    },
    { $sort: { updatedAt: -1 } },
  ]);

  const totalListings = listings.length;
  const activeListings = listings.filter((l) => l.status === "active").length;
  const pausedListings = listings.filter((l) => l.status === "paused").length;
  const totalUnits = listings.reduce((a, l) => a + (l.quantity || 0), 0);
  const unitsOnRent = listings.reduce((a, l) => a + (l.unitsOnRent || 0), 0);
  const unitsAvailable = Math.max(0, totalUnits - unitsOnRent);
  const totalFleetValue = listings.reduce(
    (a, l) => a + (l.price || 0) * (l.quantity || 0),
    0,
  );
  const activeRentalRevenue = listings.reduce(
    (a, l) => a + (l.revenueFromActive || 0),
    0,
  );
  const occupancyRate =
    totalUnits > 0 ? Math.round((unitsOnRent / totalUnits) * 1000) / 10 : 0;

  // Bookings expiring within next 48 hours
  const expiringBookings = await Booking.find({
    provider: userId,
    status: { $in: ["confirmed", "in_progress"] },
    end: { $gt: now, $lte: in48h },
  })
    .populate("listing", "title _id category price unit photos status")
    .populate("seeker", "name email phone")
    .sort({ end: 1 })
    .lean();

  // Bookings that are overdue (rental time finished but not yet returned/marked completed)
  const overdueBookings = await Booking.find({
    provider: userId,
    status: { $in: ["confirmed", "in_progress"] },
    end: { $lt: now },
  })
    .populate("listing", "title _id category price unit photos status")
    .populate("seeker", "name email phone")
    .sort({ end: 1 })
    .lean();

  // Active offline deals specifically
  const offlineDeals = await Booking.find({
    provider: userId,
    isOfflineDeal: true,
    status: { $in: ["confirmed", "in_progress"] },
  })
    .populate("listing", "title _id category price unit photos status")
    .sort({ end: 1 })
    .lean();

  const recentActivity = await Notification.find({
    user: userId,
    kind: {
      $in: [
        "rental_expiry",
        "inventory_update",
        "rental_started",
        "rental_completed",
        "booking_reminder",
        "offline_deal",
      ],
    },
  })
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  return {
    stats: {
      totalListings,
      activeListings,
      pausedListings,
      totalUnits,
      unitsOnRent,
      unitsAvailable,
      totalFleetValue,
      activeRentalRevenue,
      occupancyRate,
      offlineDealsCount: offlineDeals.length,
      overdueCount: overdueBookings.length,
    },
    listings,
    expiringBookings,
    overdueBookings,
    offlineDeals,
    recentActivity,
  };
}

export async function getListingRentals(user, listingId) {
  const listing = await Listing.findOne({
    _id: listingId,
    owner: user._id,
  })
    .select("-embedding -embeddingModel")
    .lean();

  assert(listing, 404, "Listing not found.");

  const rentals = await Booking.find({ listing: listingId, provider: user._id })
    .populate("seeker", "name email phone")
    .sort({ start: -1 })
    .lean();

  const now = new Date();
  const activeRentals = rentals.filter(
    (r) =>
      ["confirmed", "in_progress"].includes(r.status) &&
      new Date(r.end) >= now,
  );
  const overdueRentals = rentals.filter(
    (r) =>
      ["confirmed", "in_progress"].includes(r.status) &&
      new Date(r.end) < now,
  );
  const completedRentals = rentals.filter((r) => r.status === "completed");
  const cancelledRentals = rentals.filter((r) => r.status === "cancelled");

  const totalRevenue = completedRentals.reduce(
    (a, r) => a + (r.price || 0),
    0,
  );
  const durations = completedRentals
    .filter((r) => r.start && r.end)
    .map((r) => (new Date(r.end) - new Date(r.start)) / 86400000);
  const averageRentalDuration =
    durations.length > 0
      ? Math.round((durations.reduce((a, d) => a + d, 0) / durations.length) * 10) / 10
      : 0;

  return {
    listing,
    rentals,
    stats: {
      totalRentals: rentals.length,
      activeRentals: activeRentals.length,
      overdueRentals: overdueRentals.length,
      completedRentals: completedRentals.length,
      cancelledRentals: cancelledRentals.length,
      totalRevenue,
      averageRentalDuration,
    },
  };
}

export async function recordOfflineDeal(user, data) {
  const {
    listingId,
    clientName,
    clientPhone,
    clientEmail,
    notes,
    start,
    end,
    quantity,
    price,
    deposit,
    conditions,
  } = data;

  assert(listingId, 400, "Listing ID is required.");
  assert(clientName?.trim(), 400, "Client name is required.");
  assert(clientPhone?.trim(), 400, "Client phone number is required.");

  const listing = await Listing.findOne({ _id: listingId, owner: user._id });
  assert(listing, 404, "Listing not found in your inventory.");

  const rentalStart = start ? new Date(start) : new Date();
  const rentalEnd = new Date(end);
  assert(
    !isNaN(rentalEnd.getTime()) && rentalEnd > rentalStart,
    400,
    "Valid end date in the future is required.",
  );

  const rentalQty = Math.max(1, Number(quantity) || 1);

  // Check currently active units on rent for this listing
  const activeRentals = await Booking.find({
    listing: listingId,
    status: { $in: ["confirmed", "in_progress"] },
  });
  const currentlyRented = activeRentals.reduce(
    (sum, r) => sum + (r.quantity || 1),
    0,
  );
  const available = (listing.quantity || 1) - currentlyRented;

  assert(
    rentalQty <= available,
    400,
    `Only ${available} unit(s) available in your inventory. Cannot rent ${rentalQty}.`,
  );

  const booking = await Booking.create({
    listing: listingId,
    provider: user._id,
    start: rentalStart,
    end: rentalEnd,
    quantity: rentalQty,
    price: Number(price) || 0,
    deposit: Number(deposit) || 0,
    conditions: conditions || "",
    status: "in_progress",
    isOfflineDeal: true,
    offlineClient: {
      name: clientName.trim(),
      phone: clientPhone.trim(),
      email: clientEmail?.trim() || "",
      notes: notes?.trim() || "",
    },
  });

  await notify(
    user._id,
    `Offline Deal Logged: ${listing.title}`,
    `Rented ${rentalQty} unit(s) to ${clientName.trim()} until ${rentalEnd.toLocaleDateString()}.`,
    "/dashboard/inventory",
    {
      kind: "offline_deal",
      relatedBooking: booking._id,
      relatedListing: listing._id,
    },
  );

  emitToUser(user._id, "inventory_changed", {
    type: "offline_deal_created",
    listingId: listing._id,
    bookingId: booking._id,
  });

  return booking;
}

export async function returnOfflineDeal(user, bookingId, options = {}) {
  const booking = await Booking.findOne({
    _id: bookingId,
    provider: user._id,
  });

  assert(booking, 404, "Rental record not found.");
  assert(
    ["confirmed", "in_progress"].includes(booking.status),
    400,
    "This rental is already closed or cancelled.",
  );

  booking.status = "completed";
  booking.returnedAt = new Date();
  await booking.save();

  const listing = await Listing.findOne({
    _id: booking.listing,
    owner: user._id,
  });

  let reposted = false;
  if (options.repostToListing && listing && listing.status !== "active") {
    listing.status = "active";
    listing.revision = (listing.revision || 0) + 1;
    await listing.save();
    reposted = true;
  }

  const clientName = booking.offlineClient?.name || "Client";
  await notify(
    user._id,
    `Asset Returned: ${listing?.title || "Item"} Checked In`,
    `${booking.quantity || 1} unit(s) returned by ${clientName}.${reposted ? " Listing reposted to marketplace!" : ""}`,
    "/dashboard/inventory",
    {
      kind: "rental_completed",
      relatedBooking: booking._id,
      relatedListing: listing?._id,
    },
  );

  emitToUser(user._id, "inventory_changed", {
    type: "rental_completed",
    listingId: listing?._id,
    bookingId: booking._id,
    reposted,
  });

  return { success: true, booking, reposted };
}

export async function repostListing(user, listingId) {
  const listing = await Listing.findOneAndUpdate(
    { _id: listingId, owner: user._id },
    { $set: { status: "active" }, $inc: { revision: 1 } },
    { new: true },
  );

  assert(listing, 404, "Listing not found.");

  await notify(
    user._id,
    `Listing Reposted Online: ${listing.title}`,
    "Item is now live and discoverable on the marketplace for seekers.",
    "/dashboard/inventory",
    {
      kind: "inventory_update",
      relatedListing: listing._id,
    },
  );

  emitToUser(user._id, "inventory_changed", {
    type: "listing_reposted",
    listingId: listing._id,
  });

  return listing;
}

export async function addInventoryAsset(user, data) {
  assert(data.title?.trim(), 400, "Title is required.");
  assert(data.category?.trim(), 400, "Category is required.");

  const listing = await Listing.create({
    owner: user._id,
    title: data.title.trim(),
    category: data.category.trim(),
    description: data.description?.trim() || "",
    quantity: Math.max(1, Number(data.quantity) || 1),
    price: Math.max(0, Number(data.price) || 0),
    unit: ["hour", "day", "event"].includes(data.unit) ? data.unit : "day",
    deposit: Math.max(0, Number(data.deposit) || 0),
    city: data.city?.trim() || user.city || "Mumbai",
    address: data.address?.trim() || user.address || "",
    location: user.location || {
      type: "Point",
      coordinates: [72.8777, 19.076],
    },
    photos: Array.isArray(data.photos) ? data.photos : [],
    status: data.publishOnline ? "active" : "paused",
    conditions: data.conditions?.trim() || "",
  });

  await notify(
    user._id,
    `New Inventory Added: ${listing.title}`,
    listing.status === "active"
      ? "Asset is published live on the marketplace."
      : "Asset stored in offline fleet (unlisted from marketplace).",
    "/dashboard/inventory",
    {
      kind: "inventory_update",
      relatedListing: listing._id,
    },
  );

  emitToUser(user._id, "inventory_changed", {
    type: "asset_created",
    listingId: listing._id,
  });

  return listing;
}
