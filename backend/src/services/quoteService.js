import mongoose from "mongoose";
import { z } from "zod";
import {
  Quote,
  Request,
  Listing,
  Booking,
  Availability,
  Setting,
  Message,
  BusinessProfile,
} from "../models/index.js";
import { offerSchema } from "./validation.js";
import { assert } from "../middlewares/errors.js";
import { peakReserved } from "./matchingService.js";
import { notify } from "./notificationService.js";
import { broadcastMessage } from "../socket.js";
import { logWorkProcess } from "./workProcessService.js";
export const participantQuery = (user) => ({
  $or: [{ provider: user._id }, { seeker: user._id }],
});
export async function getQuote(user, id, session) {
  const q = await Quote.findOne({ _id: id, ...participantQuery(user) }).session(
    session || null,
  );
  assert(q, 404, "Negotiation not found.");
  return q;
}
export async function offer(user, id, raw) {
  const data = offerSchema.parse(raw);
  return mongoose.connection.transaction(async (session) => {
    const q = await getQuote(user, id, session);
    const r = await Request.findById(q.request).session(session);
    assert(await BusinessProfile.countDocuments({ _id: { $in: [q.provider, q.seeker] }, verification: "rejected" }).session(session) === 0, 403, "An account in this negotiation is restricted.");
    assert(
      ["open", "partial"].includes(r.status) &&
        !r.items[q.itemIndex].booking &&
        r.start > new Date(),
      409,
      "This requirement is no longer open.",
    );
    assert(
      ["invited", "offered"].includes(q.status) && q.version === data.version,
      409,
      "The negotiation changed. Refresh and try again.",
    );
    const last = q.offers.at(-1);
    assert(
      last
        ? String(last.by) !== String(user._id)
        : String(q.provider) === String(user._id),
      409,
      "Wait for the other party to respond.",
    );
    q.offers.push({
      by: user._id,
      price: data.price,
      conditions: data.conditions,
    });
    q.status = "offered";
    q.version++;
    r.revision++;
    await r.save({ session });
    await q.save({ session });
    await notify(
      String(q.provider) === String(user._id) ? q.seeker : q.provider,
      "New offer",
      `A new price of INR ${data.price} is ready for your review.`,
      "/dashboard/negotiations",
      session,
    );
    await logWorkProcess({
      user,
      action: "COUNTER_OFFER_DISPATCHED",
      title: `Dispatched counter-offer of ₹${data.price}`,
      detail: data.conditions || "Counter-offer submitted in negotiation.",
      category: "negotiation",
      metadata: { quoteId: q._id, price: data.price, version: q.version },
    });
    return q;
  });
}
export async function accept(user, id, raw) {
  const { version } = z.object({ version: z.number().int().min(1) }).parse(raw);
  return mongoose.connection.transaction(async (session) => {
    const q = await getQuote(user, id, session);
    assert(await BusinessProfile.countDocuments({ _id: { $in: [q.provider, q.seeker] }, verification: "rejected" }).session(session) === 0, 403, "An account in this booking is restricted.");
    assert(
      q.status === "offered" && q.version === version,
      409,
      "The offer changed or is no longer available.",
    );
    const last = q.offers.at(-1);
    assert(
      String(last.by) !== String(user._id),
      403,
      "You cannot accept your own offer.",
    );
    const r = await Request.findById(q.request).session(session);
    assert(
      ["open", "partial"].includes(r.status) &&
        !r.items[q.itemIndex].booking &&
        r.start > new Date(),
      409,
      "This requirement is no longer open.",
    );
    
    
    const l = await Listing.findOneAndUpdate(
      { _id: q.listing, status: "active", moderationHold: { $ne: true } },
      { $inc: { revision: 1 } },
      { new: true, session },
    );
    assert(l, 409, "This listing is no longer active.");
    const item = r.items[q.itemIndex];
    assert(
      l.category === item.category,
      409,
      "Listing category changed. Request a new offer.",
    );
    const [lon1, lat1] = l.location.coordinates;
    const [lon2, lat2] = r.location.coordinates;
    const rad = Math.PI / 180;
    const arc =
      Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
      Math.cos(lat1 * rad) *
        Math.cos(lat2 * rad) *
        Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
    const km = 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, arc)));
    assert(
      km <= r.radiusKm && l.city.toLowerCase() === r.city.toLowerCase(),
      409,
      "Listing location changed and no longer matches this request.",
    );
    assert(
      (r.end - r.start) / 3600000 >= l.minHours && l.capacity >= item.capacity,
      409,
      "Listing no longer meets the rental duration or capacity.",
    );
    assert(
      !r.delivery || l.delivery,
      409,
      "Delivery is required but is no longer available.",
    );
    const blocks = await Availability.find({
      listing: l._id,
      start: { $lt: r.end },
      end: { $gt: r.start },
    }).session(session);
    assert(
      peakReserved(blocks, r.start, r.end) + item.quantity <= l.quantity,
      409,
      "Inventory was reserved for these dates. Choose another offer.",
    );
    const policy = await Setting.findOne({ key: "platform" }).session(session);
    assert(
      last.price >= (policy?.minBookingValue || 0),
      400,
      "Offer is below the platform minimum booking value.",
    );
    const booking = (
      await Booking.create(
        [
          {
            quote: q._id,
            request: r._id,
            listing: l._id,
            provider: q.provider,
            seeker: q.seeker,
            itemIndex: q.itemIndex,
            start: r.start,
            end: r.end,
            quantity: item.quantity,
            price: last.price,
            deposit: l.deposit,
            conditions: last.conditions,
            cancellationHours: l.cancellationHours,
            commission:
              Math.round(last.price * (policy?.commissionPercent ?? 5)) / 100,
            logistics: r.delivery
              ? "Provider delivery"
              : "Seeker arranges pickup / on-site access",
          },
        ],
        { session },
      )
    )[0];
    await Availability.create(
      [
        {
          listing: l._id,
          start: r.start,
          end: r.end,
          quantity: item.quantity,
          reason: "Marketplace booking",
          booking: booking._id,
        },
      ],
      { session },
    );
    q.status = "accepted";
    q.version++;
    await q.save({ session });
    r.items[q.itemIndex].booking = booking._id;
    r.status = r.items.every((i) => i.booking) ? "confirmed" : "partial";
    r.revision++;
    await r.save({ session });
    await Quote.updateMany(
      {
        request: r._id,
        itemIndex: q.itemIndex,
        _id: { $ne: q._id },
        status: { $in: ["invited", "offered"] },
      },
      { $set: { status: "closed" } },
      { session },
    );
    for (const userId of [q.provider, q.seeker])
      await notify(
        userId,
        "Booking confirmed",
        `${l.title} is reserved. Payment is arranged directly between businesses.`,
        "/dashboard/bookings",
        session,
      );
    await logWorkProcess({
      user,
      action: "OFFER_ACCEPTED_BOOKED",
      title: `Accepted offer & reserved ${l.title}`,
      detail: `Confirmed reservation for ₹${last.price} from ${r.start.toISOString().slice(0, 10)}.`,
      category: "booking",
      metadata: { bookingId: booking._id, quoteId: q._id, price: last.price },
    });
    return booking;
  });
}
export async function decline(user, id, raw) {
  const version = z.number().int().min(0).parse(raw.version);
  const q = await Quote.findOneAndUpdate(
    {
      _id: id,
      ...participantQuery(user),
      version,
      status: { $in: ["invited", "offered"] },
    },
    { $set: { status: "declined" }, $inc: { version: 1 } },
    { new: true },
  );
  assert(q, 409, "Negotiation changed. Refresh first.");
  await logWorkProcess({
    user,
    action: "NEGOTIATION_DECLINED",
    title: "Declined negotiation offer",
    detail: `Closed negotiation round at version ${version}.`,
    category: "negotiation",
    metadata: { quoteId: q._id, version },
  });
  return q;
}
export async function message(user, id, raw) {
  const q = await getQuote(user, id);
  const text = z.string().trim().min(1).max(4000).parse(raw.text);
  const m = await Message.create({ quote: id, sender: user._id, text });
  const populated = await Message.findById(m._id)
    .populate("sender", "name")
    .lean();
  try {
    broadcastMessage(id, populated);
  } catch {}
  await notify(
    String(q.provider) === String(user._id) ? q.seeker : q.provider,
    "New message",
    "Your booking partner sent a message.",
    "/dashboard/negotiations",
  );
  return populated;
}

export async function directOffer(user, raw) {
  const schema = z.object({
    listingId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid listing ID"),
    price: z.coerce.number().positive().max(1e8),
    quantity: z.coerce.number().int().positive().default(1),
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    conditions: z.string().max(3000).default(""),
  });
  const data = schema.parse(raw);

  const listing = await Listing.findOne({
    _id: data.listingId,
    status: "active",
    moderationHold: { $ne: true },
  });
  assert(listing, 404, "Resource listing not found or not active.");
  assert(
    String(listing.owner) !== String(user._id),
    400,
    "You cannot initiate a negotiation on your own listing.",
  );
  assert(
    data.quantity <= listing.quantity,
    400,
    `Only ${listing.quantity} units are available.`,
  );

  const start =
    data.start && data.start > new Date()
      ? data.start
      : new Date(Date.now() + 24 * 3600000);
  const end =
    data.end && data.end > start
      ? data.end
      : new Date(+start + Math.max(listing.minHours, 8) * 3600000);

  return mongoose.connection.transaction(async (session) => {
    const [request] = await Request.create(
      [
        {
          title: `Direct RFQ: ${listing.title}`,
          seeker: user._id,
          items: [
            {
              category: listing.category,
              quantity: data.quantity,
              capacity: listing.capacity,
              specs:
                data.conditions ||
                `Rapido counter-offer negotiation for ${listing.title}`,
            },
          ],
          city: listing.city,
          location: {
            type: "Point",
            coordinates: listing.location.coordinates,
          },
          radiusKm: 25,
          start,
          end,
          budget: data.price,
          urgency: "routine",
          delivery: listing.delivery,
          status: "open",
        },
      ],
      { session },
    );

    const [quote] = await Quote.create(
      [
        {
          request: request._id,
          listing: listing._id,
          provider: listing.owner,
          seeker: user._id,
          itemIndex: 0,
          offers: [
            {
              by: user._id,
              price: data.price,
              conditions:
                data.conditions || "Initial Rapido counter-offer proposed.",
            },
          ],
          status: "offered",
          version: 1,
        },
      ],
      { session },
    );

    const [msg] = await Message.create(
      [
        {
          quote: quote._id,
          sender: user._id,
          text: `🤝 Proposed direct offer: INR ${data.price} (${data.quantity} unit${data.quantity > 1 ? "s" : ""}). ${data.conditions ? `Notes: "${data.conditions}"` : ""}`,
        },
      ],
      { session },
    );

    try {
      const populatedMsg = await Message.findById(msg._id)
        .populate("sender", "name")
        .session(session)
        .lean();
      broadcastMessage(quote._id, populatedMsg);
    } catch {}

    await notify(
      listing.owner,
      "New Rapido Counter-Offer",
      `${user.name} proposed INR ${data.price} for ${listing.title}.`,
      "/dashboard/negotiations",
      session,
    );

    await logWorkProcess({
      user,
      action: "DIRECT_OFFER_DISPATCHED",
      title: `Dispatched Rapido offer for ${listing.title}`,
      detail: `Proposed ₹${data.price} for ${data.quantity} units to ${listing.ownerName || "provider"}.`,
      category: "negotiation",
      metadata: { quoteId: quote._id, listingId: listing._id, price: data.price, quantity: data.quantity },
    });

    return {
      quoteId: quote._id,
      requestId: request._id,
      price: data.price,
      status: "offered",
      message: "Offer submitted successfully. Negotiation channel opened.",
    };
  });
}
