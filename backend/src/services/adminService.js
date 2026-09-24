import { z } from "zod";
import mongoose from "mongoose";
import {
  BusinessProfile,
  Category,
  Setting,
  Dispute,
  Booking,
  Quote,
  Message,
  Report,
  Listing,
  Audit,
} from "../models/index.js";
import { assert } from "../middlewares/errors.js";
import { categorySchema } from "./validation.js";
import { notify } from "./notificationService.js";
export const audit = async (user, action, target, detail, session) =>
  (
    await Audit.create(
      [{ actor: user._id, action, target: String(target), detail }],
      session ? { session } : {},
    )
  )[0];
export async function verify(user, id, raw) {
  const data = z
    .object({
      verification: z.enum(["verified", "rejected"]),
      verificationNote: z.string().trim().min(3).max(2000),
    })
    .parse(raw);
  return mongoose.connection.transaction(async (session) => {
    const profile = await BusinessProfile.findOne({
      _id: id,
      role: "business",
    }).session(session);
    assert(profile, 404, "Business not found.");
    assert(
      data.verification !== "verified" || profile.documentId,
      400,
      "Business must submit a verification document first.",
    );
    Object.assign(profile, data);
    await profile.save({ session });
    await audit(user, "verification", id, data.verificationNote, session);
    await notify(
      id,
      `Business verification ${data.verification}`,
      data.verificationNote,
      "/dashboard/profile",
      session,
    );
    return profile;
  });
}
export async function saveCategory(user, id, raw) {
  const data = categorySchema.parse(raw);
  if (id) {
    const existing = await Category.findById(id);
    assert(existing, 404, "Category not found.");
    assert(
      existing.slug === data.slug,
      409,
      "Category identifiers cannot be renamed; existing resources and requests use this identifier.",
    );
  }
  const c = id
    ? await Category.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true },
      )
    : await Category.create(data);
  assert(c, 404, "Category not found.");
  await audit(user, "category", c._id, c.name);
  return c;
}
export async function saveSettings(user, raw) {
  const data = z
    .object({
      commissionPercent: z.coerce.number().min(0).max(30),
      minBookingValue: z.coerce.number().min(0).max(1e7),
    })
    .parse(raw);
  const setting = await Setting.findOneAndUpdate(
    { key: "platform" },
    { $set: data },
    { new: true, upsert: true },
  );
  await audit(user, "settings", setting._id, JSON.stringify(data));
  return setting;
}
export async function evidence(id) {
  const d = await Dispute.findById(id).populate("openedBy", "name");
  assert(d, 404, "Dispute not found.");
  const b = await Booking.findById(d.booking)
    .populate("listing", "title")
    .populate("provider seeker", "name");
  const q = await Quote.findById(b.quote).populate("offers.by", "name");
  return {
    dispute: d,
    booking: b,
    quote: q,
    messages: await Message.find({ quote: q._id })
      .populate("sender", "name")
      .sort({ createdAt: 1 }),
  };
}
export async function resolve(user, id, raw) {
  const resolution = z.string().trim().min(10).max(5000).parse(raw.resolution);
  return mongoose.connection.transaction(async (session) => {
    const d = await Dispute.findOneAndUpdate(
      { _id: id, status: "open" },
      { $set: { status: "resolved", resolution } },
      { new: true, session },
    );
    assert(d, 409, "Dispute is not open.");
    await audit(user, "dispute", id, resolution, session);
    const b = await Booking.findById(d.booking).session(session);
    for (const uid of [b.provider, b.seeker])
      await notify(
        uid,
        "Dispute resolved",
        resolution,
        "/dashboard/disputes",
        session,
      );
    return d;
  });
}
export async function moderate(user, id, raw) {
  const { resolution, pause } = z
    .object({
      resolution: z.string().trim().min(5).max(2000),
      pause: z.boolean(),
    })
    .parse(raw);
  return mongoose.connection.transaction(async (session) => {
    const report = await Report.findOneAndUpdate(
      { _id: id, status: "open" },
      { $set: { status: "resolved", resolution } },
      { new: true, session },
    );
    assert(report, 409, "Report is not open.");
    if (pause)
      await Listing.updateOne(
        { _id: report.listing },
        {
          $set: { status: "paused", moderationHold: true },
          $inc: { revision: 1 },
        },
        { session },
      );
    await audit(user, "moderation", id, resolution, session);
    await notify(
      report.reporter,
      "Report resolved",
      resolution,
      "/dashboard/search",
      session,
    );
    return report;
  });
}
export async function releaseListing(user, id, raw) {
  const reason = z.string().trim().min(5).max(2000).parse(raw.reason);
  return mongoose.connection.transaction(async (session) => {
    const listing = await Listing.findOneAndUpdate(
      { _id: id, moderationHold: true },
      { $set: { moderationHold: false }, $inc: { revision: 1 } },
      { new: true, session },
    );
    assert(listing, 409, "Resource has no administrator hold.");
    await audit(user, "moderation-release", id, reason, session);
    await notify(
      listing.owner,
      "Resource moderation hold removed",
      `${reason} You may activate this resource from My listings.`,
      "/dashboard/listings",
      session,
    );
    return listing;
  });
}
