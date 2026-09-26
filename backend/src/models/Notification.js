import { Schema, model, ref } from "./helpers.js";

export const Notification = model("Notification", {
  user: ref("BusinessProfile"),
  title: String,
  body: String,
  href: String,
  kind: {
    type: String,
    enum: [
      "general",
      "booking_reminder",
      "rental_expiry",
      "inventory_update",
      "rental_started",
      "rental_completed",
      "offline_deal",
    ],
    default: "general",
  },
  relatedBooking: { type: Schema.Types.ObjectId, ref: "Booking" },
  relatedListing: { type: Schema.Types.ObjectId, ref: "Listing" },
  readAt: Date,
  emailStatus: { type: String, default: "pending" },
  attempts: { type: Number, default: 0 },
});
