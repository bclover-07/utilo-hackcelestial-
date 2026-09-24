import { model, ref } from "./helpers.js";

export const Dispute = model(
  "Dispute",
  {
    booking: ref("Booking"),
    openedBy: ref("BusinessProfile"),
    reason: String,
    resolution: String,
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  [
    [
      { booking: 1, openedBy: 1 },
      { unique: true, partialFilterExpression: { status: "open" } },
    ],
  ],
);
