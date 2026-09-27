import { Schema, model, ref } from "./helpers.js";

export const Notification = model("Notification", {
  user: ref("BusinessProfile"),
  title: String,
  body: String,
  href: String,
  kind: {
    type: String,
    default: "general",
  },
  relatedBooking: { type: Schema.Types.ObjectId, ref: "Booking" },
  relatedListing: { type: Schema.Types.ObjectId, ref: "Listing" },
  relatedQuote: { type: Schema.Types.ObjectId, ref: "Quote" },
  readAt: Date,
  emailStatus: { type: String, default: "pending" },
  attempts: { type: Number, default: 0 },
});
