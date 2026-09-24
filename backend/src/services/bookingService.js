import mongoose from "mongoose";
import { z } from "zod";
import {
  Booking,
  Listing,
  Availability,
  Request,
  Quote,
  Rating,
  Dispute,
} from "../models/index.js";
import { participantQuery } from "./quoteService.js";
import { assert } from "../middlewares/errors.js";
import { notify } from "./notificationService.js";
export async function getBooking(user, id, session) {
  const b = await Booking.findOne({
    _id: id,
    ...participantQuery(user),
  }).session(session || null);
  assert(b, 404, "Booking not found.");
  return b;
}
export async function transition(user, id, raw) {
  const { status, reason } = z
    .object({
      status: z.enum(["in_progress", "completed", "cancelled"]),
      reason: z.string().trim().max(2000).optional(),
    })
    .parse(raw);
  return mongoose.connection.transaction(async (session) => {
    const b = await getBooking(user, id, session);
    assert(
      ["confirmed", "in_progress"].includes(b.status),
      409,
      "Booking is already closed.",
    );
    if (status === "cancelled") {
      assert(
        reason && b.status === "confirmed" && b.start > new Date(),
        400,
        "Only future confirmed bookings can be cancelled; supply a reason.",
      );
      assert(
        (b.start - Date.now()) / 3600000 >= b.cancellationHours,
        409,
        "The cancellation window has passed. Open a dispute for assistance.",
      );
      await Listing.updateOne(
        { _id: b.listing },
        { $inc: { revision: 1 } },
        { session },
      );
      await Availability.deleteOne({ booking: b._id }, { session });
      b.cancellationReason = reason;
      const r = await Request.findById(b.request).session(session);
      r.items[b.itemIndex].booking = undefined;
      r.status = r.items.some((i) => i.booking) ? "partial" : "open";
      r.revision++;
      await r.save({ session });
      // Competing offers were closed when this item was booked. Restore those
      // conversations so the now-open requirement can actually be fulfilled.
      await Quote.updateMany(
        { request: r._id, itemIndex: b.itemIndex, status: "closed" },
        [
          {
            $set: {
              status: {
                $cond: [
                  { $gt: [{ $size: "$offers" }, 0] },
                  "offered",
                  "invited",
                ],
              },
              version: { $add: ["$version", 1] },
            },
          },
        ],
        { session },
      );
    } else {
      assert(
        String(b.provider) === String(user._id),
        403,
        "Only the provider can update fulfilment.",
      );
      assert(
        status === "in_progress"
          ? b.status === "confirmed" && b.start <= new Date()
          : b.status === "in_progress" && b.end <= new Date(),
        409,
        "This transition is not available yet. Check booking dates and status.",
      );
    }
    b.status = status;
    await b.save({ session });
    for (const uid of [b.provider, b.seeker])
      await notify(
        uid,
        `Booking ${status.replace("_", " ")}`,
        `Booking ${b._id} changed status.`,
        "/dashboard/bookings",
        session,
      );
    return b;
  });
}
export async function review(user, id, raw) {
  const data = z
    .object({
      score: z.coerce.number().int().min(1).max(5),
      comment: z.string().trim().min(5).max(3000),
    })
    .parse(raw);
  const b = await getBooking(user, id);
  assert(
    b.status === "completed",
    409,
    "Reviews are available after completion.",
  );
  return Rating.create({
    ...data,
    booking: id,
    from: user._id,
    to: String(b.provider) === String(user._id) ? b.seeker : b.provider,
  });
}
export async function dispute(user, id, raw) {
  const b = await getBooking(user, id);
  assert(b.status !== "cancelled", 409, "This booking is cancelled.");
  const reason = z.string().trim().min(10).max(5000).parse(raw.reason);
  assert(
    !(await Dispute.exists({
      booking: id,
      openedBy: user._id,
      status: "open",
    })),
    409,
    "You already have an open dispute for this booking.",
  );
  return Dispute.create({ booking: id, openedBy: user._id, reason });
}
const icsEscape = (v) =>
  String(v)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
const utc = (date) =>
  new Date(date)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
export async function calendar(user, id) {
  const b = await getBooking(user, id);
  const l = await Listing.findById(b.listing);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Utlio//Bookings//EN",
    "BEGIN:VEVENT",
    `UID:${b._id}@utlio`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(b.start)}`,
    `DTEND:${utc(b.end)}`,
    `SUMMARY:${icsEscape(l.title)}`,
    `LOCATION:${icsEscape(l.address)}`,
    `DESCRIPTION:${icsEscape(b.logistics)}`,
    `STATUS:${b.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
export async function bookingSummary(user, id) {
  const b = await getBooking(user, id);
  const q = await Quote.findById(b.quote);
  return { booking: b, offers: q.offers };
}
