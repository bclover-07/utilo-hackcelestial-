import { Schema, model, ref, point } from "./helpers.js";

export const Request = model(
  "Request",
  {
    seeker: ref("BusinessProfile"),
    title: String,
    items: [
      {
        category: String,
        quantity: Number,
        capacity: Number,
        specs: String,
        booking: { type: Schema.Types.ObjectId, ref: "Booking" },
      },
    ],
    location: point,
    city: String,
    radiusKm: Number,
    start: Date,
    end: Date,
    budget: Number,
    urgency: { type: String, enum: ["routine", "urgent", "emergency"] },
    delivery: Boolean,
    status: {
      type: String,
      enum: ["open", "partial", "confirmed", "cancelled"],
      default: "open",
    },
    revision: { type: Number, default: 0 },
  },
  [[{ location: "2dsphere" }]],
);
