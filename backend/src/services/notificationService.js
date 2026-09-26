import nodemailer from "nodemailer";
import { Notification, BusinessProfile } from "../models/index.js";
import { emitToUser, getIO } from "../socket.js";

export async function notify(user, title, body, href, sessionOrMeta, maybeMeta) {
  let session = null;
  let meta = {};
  if (sessionOrMeta && sessionOrMeta.startTransaction) {
    session = sessionOrMeta;
    meta = maybeMeta || {};
  } else if (sessionOrMeta && typeof sessionOrMeta === "object") {
    meta = sessionOrMeta;
  }

  const payload = {
    user,
    title,
    body,
    href,
    kind: meta.kind || "general",
    relatedBooking: meta.relatedBooking,
    relatedListing: meta.relatedListing,
  };

  const docs = await Notification.create([payload], session ? { session } : {});
  const created = docs[0];

  try {
    emitToUser(user, "notification", created);
    emitToUser(user, "notification_new", created);
    emitToUser(user, "inventory_changed", {
      kind: meta.kind,
      bookingId: meta.relatedBooking,
      listingId: meta.relatedListing,
    });
  } catch {
    // Non-blocking socket emission
  }

  return created;
}
export async function deliverEmails() {
  if (!process.env.SMTP_HOST || !process.env.EMAIL_FROM) return;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  for (let i = 0; i < 30; i++) {
    const n = await Notification.findOneAndUpdate(
      { emailStatus: "pending", attempts: { $lt: 5 } },
      { $set: { emailStatus: "sending" }, $inc: { attempts: 1 } },
      { new: true },
    );
    if (!n) break;
    try {
      const user = await BusinessProfile.findById(n.user);
      await transport.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: n.title,
        text: `${n.body}\n${process.env.FRONTEND_ORIGIN}${n.href}`,
      });
      n.emailStatus = "sent";
    } catch {
      n.emailStatus = n.attempts >= 5 ? "failed" : "pending";
    }
    await n.save();
  }
  await Notification.updateMany(
    {
      emailStatus: "sending",
      updatedAt: { $lt: new Date(Date.now() - 10 * 60000) },
    },
    { $set: { emailStatus: "pending" } },
  );
}
