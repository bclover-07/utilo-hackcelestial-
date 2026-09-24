import { z } from "zod";
import { invoke } from "./shared.js";
import { Request as RequestModel } from "../models/Request.js";
import { search } from "../services/matchingService.js";
import { assert } from "../middlewares/errors.js";

export async function computeUrgency(user, raw) {
  const { requestId } = z
    .object({ requestId: z.string().regex(/^[a-f0-9]{24}$/i) })
    .parse(raw);
  const request = await RequestModel.findOne({
    _id: requestId,
    seeker: user._id,
  }).lean();
  assert(request, 404, "Request not found.");

  const now = new Date();
  const hoursUntilStart = request.start
    ? (new Date(request.start) - now) / 3600000
    : null;

  assert(
    ["open", "partial"].includes(request.status) && request.start > new Date(),
    409,
    "Urgency analysis requires an upcoming open request.",
  );

  const supply = await Promise.all(
    request.items
      .filter((i) => !i.booking)
      .map(async (item) => {
        const result = await search(
          {
            category: item.category,
            quantity: item.quantity,
            capacity: item.capacity,
            start: request.start,
            end: request.end,
            city: request.city,
            coordinates: request.location.coordinates,
            radiusKm: request.radiusKm,
            delivery: request.delivery,
          },
          user,
        );
        return {
          category: item.category,
          matchingListings: result.total,
          candidateLimit: result.candidateLimit,
        };
      }),
  );

  const supplyCount = supply.reduce(
    (sum, item) => sum + item.matchingListings,
    0,
  );
  assert(supply.length, 409, "All request items are already booked.");
  const leastCoveredItem = Math.min(
    ...supply.map((item) => item.matchingListings),
  );

  const competingRequests = await RequestModel.countDocuments({
    status: { $in: ["open", "partial"] },
    "items.category": { $in: request.items.map((i) => i.category) },
    city: request.city,
    start: { $lt: request.end },
    end: { $gt: request.start },
    _id: { $ne: request._id },
  });

  let timeScore = 50;
  if (hoursUntilStart !== null) {
    if (hoursUntilStart < 24) timeScore = 100;
    else if (hoursUntilStart < 72) timeScore = 85;
    else if (hoursUntilStart < 168) timeScore = 65;
    else if (hoursUntilStart < 720) timeScore = 40;
    else timeScore = 20;
  }

  const urgencyMultiplier =
    request.urgency === "emergency"
      ? 1.5
      : request.urgency === "urgent"
        ? 1.2
        : 1.0;

  const supplyScarcity =
    leastCoveredItem < 3 ? 30 : leastCoveredItem < 10 ? 15 : 0;
  const competitionPressure =
    competingRequests > 5 ? 20 : competingRequests > 2 ? 10 : 0;

  const rawScore = Math.min(
    100,
    Math.round(
      timeScore * urgencyMultiplier + supplyScarcity + competitionPressure,
    ),
  );

  const explanation = await invoke(
    "Briefly explain this deterministic urgency heuristic using only supplied factors. Supply is counted independently for each unbooked item, capped at 200 candidates per search; counts are not unique providers or guaranteed bookable bundles. Scarcity uses the least-covered item. This score is not a probability or market forecast. Never invent additional urgency.",
    {
      score: rawScore,
      hoursUntilStart,
      urgencyLevel: request.urgency,
      supplyCount,
      supplyByItem: supply,
      leastCoveredItem,
      competingRequests,
      itemCount: request.items.length,
    },
  );

  return {
    score: rawScore,
    factors: {
      supplyByItem: supply,
      timeProximity: timeScore,
      urgencyLevel: request.urgency,
      supplyAvailable: supplyCount,
      leastCoveredItem,
      competingRequests,
      hoursUntilStart:
        hoursUntilStart !== null ? Math.round(hoursUntilStart) : null,
    },
    explanation,
    trace: [
      "Urgency scorer: computed time proximity score",
      "Urgency scorer: assessed supply scarcity",
      "Urgency scorer: factored competition pressure",
      "Gemini: generated plain-English explanation",
    ],
  };
}
