import { Schema, model, ref } from "./helpers.js";

export const Memory = model(
  "Memory",
  {
    owner: ref("BusinessProfile"),
    category: {
      type: String,
      enum: ["preference", "constraint", "logistics", "vendor_affinity"],
      default: "preference",
    },
    key: { type: String, required: true },
    value: { type: String, required: true },
    confidence: { type: Number, default: 1 },
    source: {
      type: String,
      enum: ["user_stated", "inferred_brief", "booking_history"],
      default: "user_stated",
    },
    pinned: { type: Boolean, default: false },
  },
  [
    [{ owner: 1, key: 1 }, { unique: true }],
    [{ owner: 1, category: 1 }],
  ],
);
