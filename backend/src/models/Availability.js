import { Schema, model, ref } from "./helpers.js";

export const Availability = model(
  "Availability",
  {
    listing: ref("Listing"),
    start: Date,
    end: Date,
    quantity: Number,
    reason: String,
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
  },
  [[{ listing: 1, start: 1, end: 1 }]],
);
