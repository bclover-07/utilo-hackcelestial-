import { model, ref } from "./helpers.js";

export const Booking = model("Booking", {
  quote: { ...ref("Quote"), unique: true },
  request: ref("Request"),
  listing: ref("Listing"),
  provider: ref("BusinessProfile"),
  seeker: ref("BusinessProfile"),
  itemIndex: Number,
  start: Date,
  end: Date,
  quantity: Number,
  price: Number,
  deposit: Number,
  commission: Number,
  conditions: String,
  logistics: String,
  cancellationHours: Number,
  cancellationReason: String,
  status: {
    type: String,
    enum: ["confirmed", "in_progress", "completed", "cancelled"],
    default: "confirmed",
  },
  reminderSent: Boolean,
});
