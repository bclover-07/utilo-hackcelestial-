import { model } from "./helpers.js";

export const Setting = model("Setting", {
  key: { type: String, unique: true },
  commissionPercent: { type: Number, default: 5 },
  minBookingValue: { type: Number, default: 0 },
});
