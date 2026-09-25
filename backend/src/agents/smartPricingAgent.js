import { z } from "zod";
import { invoke } from "./shared.js";
import { Listing } from "../models/Listing.js";
import { Booking } from "../models/Booking.js";
import { Category } from "../models/Category.js";
import { demandHeatmap } from "../services/aggregationPipelines.js";
import { assert } from "../middlewares/errors.js";
import { adviceSchema, adviceInstruction, pricingEvidence, optionalAdvice } from "../services/agentContracts.js";

export async function recommendPrice(user, raw) {
  const { listingId, category } = z
    .object({
      listingId: z
        .string()
        .regex(/^[a-f0-9]{24}$/i)
        .optional(),
      category: z.string().trim().min(1).max(50),
    })
    .parse(raw);

  const listing = listingId
    ? await Listing.findOne({ _id: listingId, owner: user._id }).lean()
    : null;

  assert(!listingId || listing, 404, "Listing not found.");
  assert(await Category.exists({ slug: category }), 422, "Category not found.");
  assert(
    !listing || listing.category === category,
    422,
    "Choose the listing category.",
  );

  const comparables = await Listing.aggregate([
    {
      $match: {
        category,
        status: "active",
        moderationHold: { $ne: true },
        owner: { $ne: user._id },
        ...(listing ? { city: listing.city, unit: listing.unit } : {}),
      },
    },
    {
      $group: {
        _id: "$unit",
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        avgPrice: { $avg: "$price" },
        count: { $sum: 1 },
      },
    },
  ]);

  const recentBookings = await Booking.aggregate([
    {
      $match: {
        status: { $ne: "cancelled" },
        createdAt: { $gte: new Date(Date.now() - 90 * 86400000) },
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
    { $match: { "listingDoc.category": category, ...(listing ? { "listingDoc.city": listing.city, "listingDoc.unit": listing.unit } : {}) } },
    {
      $group: {
        _id: null,
        avgBookedPrice: { $avg: "$price" },
        bookingCount: { $sum: 1 },
        minBookedPrice: { $min: "$price" },
        maxBookedPrice: { $max: "$price" },
      },
    },
  ]);

  const heatmap = await demandHeatmap({ category, ...(listing ? { city: listing.city } : {}) });
  const evidence = pricingEvidence(comparables);

  const output = await optionalAdvice(() => invoke(
    "You are a B2B pricing advisor for hospitality resources. Distinguish per-unit listing rates from total booking amounts, which depend on quantity and duration. Do not compare those as equivalent. Keep rental units separate. Suggest a range only when suggestedRangeAvailable is true, within that unit's observed range. Acknowledge differences in capacity and specifications. Listing rates are asking prices, not accepted deals." + adviceInstruction,
    {
      currentListing: listing
        ? { title: listing.title, price: listing.price, unit: listing.unit }
        : null,
      category,
      evidence,
      comparableListings: comparables,
      recentBookingPrices: recentBookings[0] || null,
      demandSignals: heatmap.slice(0, 5),
    }, adviceSchema, "Review comparable pricing",
  ));

  return {
    ...output,
    advice: output.decision?.summary || output.generation.message,
    evidence,
    comparables,
    recentBookings: recentBookings[0] || null,
    demandSignals: heatmap.slice(0, 5),
    trace: [
      "Smart pricing: gathered comparable listings",
      "Smart pricing: analyzed recent booking prices",
      "Smart pricing: factored demand signals",
      output.decision ? "Gemini: generated structured pricing advice" : "AI advice unavailable; observed rates retained",
    ],
  };
}
