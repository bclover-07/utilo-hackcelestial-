import cron from "node-cron";
import { BusinessProfile, Booking } from "../models/index.js";
import { generateInsight } from "../agents/workflows.js";
import { deliverEmails, notify } from "../services/notificationService.js";
export function startJobs() {
  cron.schedule(
    "0 2 * * *",
    async () => {
      for await (const user of BusinessProfile.find({
        role: "business",
      }).cursor()) {
        try {
          await generateInsight(user);
        } catch {
          console.warn("Nightly insight unavailable for a business.");
        }
      }
    },
    { timezone: "Asia/Kolkata", noOverlap: true },
  );
  cron.schedule(
    "*/2 * * * *",
    async () => {
      try {
        await deliverEmails();
      } catch {
        console.warn("Email delivery cycle failed.");
      }
      for (const b of await Booking.find({
        status: "confirmed",
        reminderSent: { $ne: true },
        start: { $gt: new Date(), $lt: new Date(Date.now() + 24 * 3600000) },
      })) {
        for (const uid of [b.provider, b.seeker])
          await notify(
            uid,
            "Booking starts within 24 hours",
            "Confirm pickup or delivery arrangements with your partner.",
            "/dashboard/bookings",
          );
        b.reminderSent = true;
        await b.save();
      }
    },
    { noOverlap: true },
  );
}
