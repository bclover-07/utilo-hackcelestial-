import { model, ref } from "./helpers.js";

export const Rating = model(
  "Rating",
  {
    booking: ref("Booking"),
    from: ref("BusinessProfile"),
    to: ref("BusinessProfile"),
    score: { type: Number, min: 1, max: 5 },
    comment: String,
  },
  [[{ booking: 1, from: 1 }, { unique: true }]],
);
