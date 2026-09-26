import cron from "node-cron";
import { BusinessProfile, Booking } from "../models/index.js";
import { generateInsight } from "../agents/workflows.js";
import { deliverEmails, notify } from "../services/notificationService.js";
import { trackAgent } from "../services/agentRuntime.js";

export function startJobs() {
  // Nightly provider digest at 2:00 AM IST
  cron.schedule(
    "0 2 * * *",
    async () => {
      for await (const user of BusinessProfile.find({
        role: "business",
      }).cursor()) {
        try {
          await trackAgent(user, "provider-digest", () => generateInsight(user));
        } catch {
          console.warn("Nightly insight unavailable for a business.");
        }
      }
    },
    { timezone: "Asia/Kolkata", noOverlap: true },
  );

  // Every 2 minutes: Email delivery, start reminders, and rental expiry tracking
  cron.schedule(
    "*/2 * * * *",
    async () => {
      try {
        await deliverEmails();
      } catch {
        console.warn("Email delivery cycle failed.");
      }

      const now = new Date();

      // 1. Upcoming start reminders (within 24h)
      for (const b of await Booking.find({
        status: "confirmed",
        reminderSent: { $ne: true },
        start: { $gt: now, $lt: new Date(Date.now() + 24 * 3600000) },
      })) {
        const uids = [b.provider, b.seeker].filter(Boolean);
        for (const uid of uids) {
          await notify(
            uid,
            "Booking starts within 24 hours",
            "Confirm pickup or delivery arrangements with your partner.",
            "/dashboard/bookings",
          );
        }
        b.reminderSent = true;
        await b.save();
      }

      // 2. Rental Expiry Upcoming (within 24h of finish)
      const in24h = new Date(Date.now() + 24 * 3600000);
      const endingSoon = await Booking.find({
        status: { $in: ["confirmed", "in_progress"] },
        returnReminderSent: { $ne: true },
        end: { $gt: now, $lte: in24h },
      }).populate("listing", "title");

      for (const b of endingSoon) {
        const title = b.listing?.title || "Item";
        const clientInfo = b.isOfflineDeal
          ? `(Offline: ${b.offlineClient?.name || "Client"})`
          : "";
        await notify(
          b.provider,
          `Rental Ending Soon: ${title} ${clientInfo}`.trim(),
          `The rental period concludes within 24 hours. Prepare for return check-in and inventory restocking.`,
          "/dashboard/inventory",
          {
            kind: "rental_expiry",
            relatedBooking: b._id,
            relatedListing: b.listing?._id,
          },
        );

        if (b.seeker) {
          await notify(
            b.seeker,
            `Rental Ending Soon: ${title}`,
            `Your rental period finishes within 24 hours. Please prepare for return or check with provider.`,
            "/dashboard/bookings",
            { kind: "rental_expiry", relatedBooking: b._id },
          );
        }

        b.returnReminderSent = true;
        await b.save();
      }

      // 3. Overdue Rental Alert (rental period finished, not yet completed)
      const overdue = await Booking.find({
        status: { $in: ["confirmed", "in_progress"] },
        expiryNotifiedAt: { $exists: false },
        end: { $lte: now },
      }).populate("listing", "title");

      for (const b of overdue) {
        const title = b.listing?.title || "Item";
        const clientName = b.isOfflineDeal
          ? b.offlineClient?.name || "Offline Client"
          : "Seeker";

        await notify(
          b.provider,
          `⚠️ Rental Expired: ${title}`,
          `Rental duration ended for ${clientName}. Verify return to update inventory or repost to marketplace.`,
          "/dashboard/inventory",
          {
            kind: "rental_expiry",
            relatedBooking: b._id,
            relatedListing: b.listing?._id,
          },
        );

        if (b.seeker) {
          await notify(
            b.seeker,
            `⚠️ Rental Overdue: ${title}`,
            `The rental duration has concluded. Please complete item return and check-in.`,
            "/dashboard/bookings",
            { kind: "rental_expiry", relatedBooking: b._id },
          );
        }

        b.expiryNotifiedAt = new Date();
        await b.save();
      }
    },
    { noOverlap: true },
  );
}
