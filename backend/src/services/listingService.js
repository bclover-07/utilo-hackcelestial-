import mongoose from "mongoose";
import { z } from "zod";
import {
  Listing,
  Category,
  Upload,
  Availability,
  SavedSearch,
} from "../models/index.js";
import { listingSchema, range, validRange } from "./validation.js";
import { assert } from "../middlewares/errors.js";
import { peakReserved, search } from "./matchingService.js";
import { notify } from "./notificationService.js";
export async function ownListing(user, id, session) {
  const l = await Listing.findOne({ _id: id, owner: user._id }).session(
    session || null,
  );
  assert(l, 404, "Listing not found.");
  return l;
}
async function validateListing(user, raw) {
  const data = listingSchema.parse(raw);
  const cat = await Category.findOne({ slug: data.category });
  assert(cat, 400, "Choose an existing category.");
  for (const field of cat.requiredFields)
    assert(
      typeof data.attributes[field.key] ===
        (field.type === "text" ? "string" : field.type) &&
        data.attributes[field.key] !== "",
      400,
      `Required specification: ${field.label}`,
    );
  if (data.photos.length)
    assert(
      (await Upload.countDocuments({
        owner: user._id,
        kind: "image",
        url: { $in: data.photos },
      })) === new Set(data.photos).size,
      400,
      "Use your own uploaded photos.",
    );
  const { coordinates, ...rest } = data;
  return { ...rest, location: { type: "Point", coordinates } };
}
export async function createListing(user, raw) {
  const data = await validateListing(user, raw);
  const l = await Listing.create({ ...data, owner: user._id });
  
  for (const saved of await SavedSearch.find({
    "filters.category": l.category,
  }).limit(100)) {
    const result = await search(saved.filters, { _id: saved.owner });
    if (result.items.some((item) => String(item._id) === String(l._id)))
      await notify(
        saved.owner,
        "A resource matches your saved search",
        l.title,
        "/dashboard/search",
      );
  }
  return l;
}
export async function updateListing(user, id, raw) {
  const data = await validateListing(user, raw);
  return mongoose.connection.transaction(async (session) => {
    const l = await ownListing(user, id, session);
    l.revision += 1;
    await l.save({ session });
    const future = await Availability.find({
      listing: l._id,
      end: { $gt: new Date() },
    }).session(session);
    assert(
      data.quantity >= peakReserved(future, new Date(), new Date("9999-01-01")),
      409,
      "Quantity cannot be lower than reserved inventory.",
    );
    Object.assign(l, data);
    l.embedding = undefined;
    l.indexedAt = undefined;
    await l.save({ session });
    return l;
  });
}
export async function setStatus(user, id, body) {
  const { status } = z
    .object({ status: z.enum(["active", "paused", "archived"]) })
    .parse(body);
  const l = await ownListing(user, id);
  assert(status !== "active" || user.verification !== "rejected", 403, "Your account is restricted from publishing resources. Please contact support.");
  assert(
    status !== "active" || !l.moderationHold,
    409,
    "This resource is paused by an administrator. Contact support for review.",
  );
  const updated = await Listing.findOneAndUpdate(
    {
      _id: id,
      owner: user._id,
      ...(status === "active" ? { moderationHold: { $ne: true } } : {}),
    },
    { $set: { status }, $inc: { revision: 1 } },
    { new: true, runValidators: true },
  );
  assert(
    updated,
    409,
    "Resource changed or is under administrator review. Refresh first.",
  );
  return updated;
}
export async function block(user, id, raw) {
  const data = z
    .object({
      ...range,
      quantity: z.coerce.number().int().positive(),
      reason: z.string().trim().min(1).max(300),
    })
    .refine(validRange)
    .parse(raw);
  return mongoose.connection.transaction(async (session) => {
    const l = await ownListing(user, id, session);
    l.revision++;
    await l.save({ session });
    const blocks = await Availability.find({
      listing: id,
      start: { $lt: data.end },
      end: { $gt: data.start },
    }).session(session);
    assert(
      peakReserved(blocks, data.start, data.end) + data.quantity <= l.quantity,
      409,
      "Insufficient unreserved quantity for those dates.",
    );
    return (
      await Availability.create([{ ...data, listing: id }], { session })
    )[0];
  });
}
export async function unblock(user, id, blockId) {
  return mongoose.connection.transaction(async (session) => {
    const l = await ownListing(user, id, session);
    l.revision++;
    await l.save({ session });
    const removed = await Availability.findOneAndDelete({
      _id: blockId,
      listing: id,
      booking: { $exists: false },
    }).session(session);
    assert(
      removed,
      404,
      "Owner block not found; bookings must be cancelled through their booking.",
    );
    return { ok: true };
  });
}
