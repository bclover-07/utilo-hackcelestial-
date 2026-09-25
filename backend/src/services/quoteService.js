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
    assert(await BusinessProfile.countDocuments({ _id: { $in: [q.provider, q.seeker] }, verification: "verified" }).session(session) === 2, 403, "Both businesses must be approved before negotiating.");
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
    return q;
  });
}
export async function accept(user, id, raw) {
  const { version } = z.object({ version: z.number().int().min(1) }).parse(raw);
  return mongoose.connection.transaction(async (session) => {
    const q = await getQuote(user, id, session);
    assert(await BusinessProfile.countDocuments({ _id: { $in: [q.provider, q.seeker] }, verification: "verified" }).session(session) === 2, 403, "Both businesses must be approved before confirming a booking.");
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
  return q;
}
export async function message(user, id, raw) {
  const q = await getQuote(user, id);
  const text = z.string().trim().min(1).max(4000).parse(raw.text);
  const m = await Message.create({ quote: id, sender: user._id, text });
  await notify(
    String(q.provider) === String(user._id) ? q.seeker : q.provider,
    "New message",
    "Your booking partner sent a message.",
    "/dashboard/negotiations",
  );
  return m;
}
